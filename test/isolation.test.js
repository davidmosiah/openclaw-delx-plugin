import test from 'node:test';
import assert from 'node:assert/strict';
import plugin from '../index.js';
const response=(data,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(data)});
const success=()=>response({results:[{ok:true,content:[{type:'text',text:'fixture'}]}]});
function instance(host,id){const tools=[];const api={config:{apiBase:`https://${host}`,agentId:id},registerTool:t=>tools.push(t)};plugin.register(api);return {api,call:(name='delx_daily_checkin',params={})=>tools.find(t=>t.name===name).execute('fixture',params)};}
async function mocked(fn,body){const old=globalThis.fetch;globalThis.fetch=fn;try{await body();}finally{globalThis.fetch=old;}}

test('identity isolation across registrations, hosts, and subsequent configuration mutation',async()=>{
 const calls=[];let registrations=0;
 await mocked(async(url,init)=>{const host=new URL(url).hostname,body=JSON.parse(init.body);calls.push({host,body,headers:init.headers});if(url.endsWith('/register')){registrations++;return response({agent_id:body.agent_id,session_id:`session-${body.agent_id}`,identity_auth:{token:`token-${body.agent_id}`}});}assert.equal(body.agent_token,`token-${body.agent_id}`);assert.equal(body.calls[0].arguments.session_id,`session-${body.agent_id}`);assert.equal(init.headers['x-delx-agent-token'],body.agent_token);return success();},async()=>{
  const a=instance('a.invalid','a'),b=instance('b.invalid','b');await a.call();await b.call();a.api.config.apiBase='https://changed.invalid';a.api.config.agentId='changed';await a.call();assert.equal(registrations,2);assert.deepEqual(calls.filter(c=>c.body.calls).map(c=>[c.host,c.body.agent_id]),[['a.invalid','a'],['b.invalid','b'],['a.invalid','a']]);
 });
});

test('concurrent first calls register once per instance even on shared host',async()=>{
 let registrations=0,batches=0;
 await mocked(async(url,init)=>{const body=JSON.parse(init.body);if(url.endsWith('/register')){registrations++;await new Promise(r=>setTimeout(r,5));return response({agent_id:body.agent_id,session_id:`session-${body.agent_id}`,identity_auth:{token:`token-${body.agent_id}`}});}batches++;assert.equal(body.agent_token,`token-${body.agent_id}`);assert.equal(body.calls[0].arguments.session_id,`session-${body.agent_id}`);return success();},async()=>{const a=instance('same.invalid','a'),b=instance('same.invalid','b');await Promise.all([a.call(),a.call(),b.call(),b.call()]);assert.equal(registrations,2);assert.equal(batches,4);});
});

for(const failure of ['401','session-not-found'])test(`retry ${failure} remaps nested arguments to newly registered session`,async()=>{
 let registrations=0,batches=0;const requests=[];
 await mocked(async(url,init)=>{const body=JSON.parse(init.body);requests.push(body);if(url.endsWith('/register')){registrations++;return response({agent_id:'retry-agent',session_id:`session-${registrations}`,identity_auth:{token:`token-${registrations}`}});}batches++;if(batches===1)return failure==='401'?response({},401):response({results:[{ok:false,content:[{type:'text',text:'session not found'}]}]});assert.equal(body.session_id,'session-2');assert.equal(body.agent_token,'token-2');assert.equal(body.calls[0].arguments.session_id,'session-2');assert.equal(body.calls[0].arguments.status,'same input');return success();},async()=>{const a=instance('retry.invalid','retry-agent');await a.call('delx_daily_checkin',{status:'same input'});assert.equal(registrations,2);assert.equal(batches,2);assert.equal(requests.filter(r=>!r.calls)[1].rotate_token,failure==='401');});
});

test('failed registration can retry without poisoning the single-flight promise',async()=>{
 let registrations=0;
 await mocked(async(url)=>{if(url.endsWith('/register')){registrations++;if(registrations===1)throw new Error('synthetic failure');return response({agent_id:'recover',session_id:'recovered',identity_auth:{token:'fake'}});}return success();},async()=>{const a=instance('recover.invalid','recover');await assert.rejects(a.call(),/synthetic failure/);await a.call();assert.equal(registrations,2);});
});
