export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const apiKey=process.env.ELEVENLABS_API_KEY;
  if(!apiKey) return res.status(503).json({error:'Voice synthesis is not configured'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const {voiceId,text}=body;
    if(!voiceId||!text) return res.status(400).json({error:'voiceId and text are required'});
    const r=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voiceId),{
      method:'POST',
      headers:{
        'xi-api-key':apiKey,
        'Content-Type':'application/json',
        'Accept':'audio/mpeg'
      },
      body:JSON.stringify({
        text:String(text),
        model_id:'eleven_multilingual_v2',
        language_code:'es',
        voice_settings:{stability:0.58,similarity_boost:0.82,style:0.15,use_speaker_boost:true}
      })
    });
    if(!r.ok){
      const err=await r.json().catch(()=>({}));
      return res.status(r.status).json({error:err?.detail?.message||err?.detail||err?.message||'Speech generation failed'});
    }
    const buf=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type','audio/mpeg');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(buf);
  }catch(e){
    return res.status(500).json({error:e?.message||'Unexpected error'});
  }
}
