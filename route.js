import { NextResponse } from 'next/server';
const modules={advisor:'Педагогикалық жағдаятты талда. Құрылым: жағдайды түсіну, қауіпсіз алғашқы қадамдар, оқушымен әңгімелесу, сынып жетекшісі және ата-анамен жұмыс, алдын алу, нәтиже. Диагноз қойма, баланы кінәлама.',planner:'Тәрбие сағатының нақты, шығармашылық жоспарын дайында: сынып, мақсат, уақыт, кезеңдер, әдістер, тапсырмалар, рефлексия, күтілетін нәтиже.',analytics:'ТЕК берілген нақты сандарды талда. Жетпейтін мәліметтерді анық айт, ешқандай сан ойдан қоспа. Негізгі байқаулар, ұсыныстар және келесі қадамдар.',ideas:'Тәрбие бағытына арналған 3 шығармашылық идея ұсын: атауы, мақсаты, қатысушылары, алгоритмі, құралдары, нәтиже.',reports:'Тек берілген деректерге сүйенген ресми есеп жобасын дайында: атқарылған жұмыс, нәтиже, қиындық, ұсыныс, келесі міндеттер. Жоқ ақпаратты ойдан қоспа.'};
export async function POST(request){try{
 const {module,input}=await request.json();
 if(!modules[module]||typeof input!=='string'||!input.trim()||input.length>7000)return NextResponse.json({error:'Сұрау дұрыс толтырылмаған.'},{status:400});
 const key=process.env.OPENAI_API_KEY;
 if(!key)return NextResponse.json({error:'OPENAI_API_KEY орнатылмаған. Vercel → Settings → Environment Variables бөліміне кілтті енгізіңіз.'},{status:503});
 const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',instructions:`Сен Қазақстан мектебінің тәрбие ісіне арналған қазақтілді кәсіби көмекшісің. Қазақ тілінде нақты әрі сауатты жауап бер. Балалардың жеке деректерін сұрама. ЖИ жауабы педагог шешімін алмастырмайтынын ескер. ${modules[module]}`,input,max_output_tokens:1500}),cache:'no-store'});
 const data=await response.json();if(!response.ok)return NextResponse.json({error:data?.error?.message||'AI қызметі жауап бермеді.'},{status:502});
 const output=(data.output||[]).flatMap(x=>(x.content||[]).filter(c=>c.type==='output_text').map(c=>c.text)).join('\n').trim()||data.output_text||'';
 return NextResponse.json({output:output||'Жауап бос қайтты. Қайта көріңіз.'});
 }catch(e){return NextResponse.json({error:'Сервер қатесі. Интернет пен баптауларды тексеріңіз.'},{status:500})}}
