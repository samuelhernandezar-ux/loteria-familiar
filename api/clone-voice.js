export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  const apiKey=process.env.ELEVENLABS_API_KEY;
  if(!apiKey) return res.status(503).json({error:'Voice cloning is not configured'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
    const {audioBase64,mimeType='audio/webm',name='Voz familiar',consent=false}=body;
    if(consent!==true) return res.status(400).json({error:'Consent is required'});
    if(!audioBase64) return res.status(400).json({error:'Audio sample is required'});

    const bytes=Buffer.from(audioBase64,'base64');
    if(bytes.length<10000) return res.status(400).json({error:'Audio sample is too short'});

    const form=new FormData();
    form.append('name',String(name).slice(0,100));
    form.append('description','Voz creada desde Lotería Familiar con consentimiento confirmado por el usuario.');
    form.append('remove_background_noise','false');
    form.append('files',new Blob([bytes],{type:mimeType}),'sample.webm');

    const r=await fetch('https://api.elevenlabs.io/v1/voices/add',{
      method:'POST',
      headers:{'xi-api-key':apiKey},
      body:form
    });
    const data=await r.json().catch(()=>({}));
    if(!r.ok) return res.status(r.status).json({error:data?.detail?.message||data?.detail||data?.message||'Voice clone failed'});
    return res.status(200).json({voiceId:data.voice_id,requiresVerification:Boolean(data.requires_verification)});
  }catch(e){
    return res.status(500).json({error:e?.message||'Unexpected error'});
  }
}
