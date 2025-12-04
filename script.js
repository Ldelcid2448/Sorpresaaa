/* ==========================================
   script.js — emojis flotantes + swipe + tilt
========================================== */

document.addEventListener("DOMContentLoaded", ()=>{

    const carousel = document.getElementById("carousel");
    const cards = [...document.querySelectorAll(".card")];
    const dotsContainer = document.getElementById("dots");
    const emojiLayer = document.getElementById("emojiLayer");

    /* ===============================
       EMOJIS POR TEMA
    =============================== */
    const emojiMap = {
        "intro":       ["💫","✨","💛","🌟"],
        "quimica":     ["🧪","⚗️","🧬","💥"],
        "biologia":    ["🌱","🧬","🍃","🦠"],
        "astrologia":  ["✨","🌙","⭐","🔮"],
        "filosofia":   ["📜","🧠","📚","✒️"],
        "pintura":     ["🎨","🖌️","🖼️","✨"],
        "musica":      ["🎵","🎶","🎧","🎹"],
        "cine":        ["🎬","📽️","🍿","🎞️"],
        "arqueologia": ["🪨","🏺","🗿","⛏️"],
        "antropologia":["🌍","🤝","🧭","👣"],
        "conclusion":  ["💕","💗","💖","❤️"]
    };

    /* ===============================
       CREACIÓN DE DOTS
    =============================== */
    cards.forEach((_,i)=>{
        const d=document.createElement("div");
        d.className="dot";
        d.dataset.index=i;
        dotsContainer.appendChild(d);
        d.onclick = ()=> scrollToIndex(i);
    });
    const dots=[...dotsContainer.children];

    /* ===============================
       ACTUALIZAR TARJETA ACTIVA
    =============================== */
    function updateActive(){
        let nearest = 0, minDist = Infinity;
        cards.forEach((card,i)=>{
            const rect = card.getBoundingClientRect();
            const c = Math.abs(rect.left + rect.width/2 - window.innerWidth/2);
            if(c < minDist){ minDist = c; nearest = i; }
        });

        cards.forEach((c,i)=> c.classList.toggle("active", i===nearest));
        dots.forEach((d,i)=> d.classList.toggle("active", i===nearest));

        updateEmojis(cards[nearest].dataset.theme);
    }

    /* ===============================
       EMOJIS FLOTANTES
    =============================== */

    function updateEmojis(theme){
    // Limpia TODOS los emojis anteriores
    while(emojiLayer.firstChild){
        emojiLayer.removeChild(emojiLayer.firstChild);
    }

    // Evita spawnear emojis durante 200ms para suavizar el cambio
    setTimeout(()=>{
        const arr = emojiMap[theme] || ["✨"];

        for(let i=0;i<22;i++){
            const e=document.createElement("div");
            e.className="float-emoji";
            e.textContent = arr[Math.floor(Math.random()*arr.length)];

            const size = Math.random()*30 + 20;
            const x = Math.random()*100;
            const delay = Math.random()*4;
            const duration = 8 + Math.random()*6;
            const rot = Math.random()*360;

            e.style.left = x+"vw";
            e.style.fontSize = size+"px";
            e.style.animationDuration = duration+"s";
            e.style.animationDelay = delay+"s";
            e.style.transform = `rotate(${rot}deg)`;

            emojiLayer.appendChild(e);
        }
    },100);
}


    /* Inicial */
    updateActive();

    /* ===============================
       SWIPE + INERCIA
    =============================== */

    let isDown=false, startX=0, startScroll=0;
    let lastX=0, lastT=0, vel=0;

    carousel.onpointerdown = e=>{
        isDown=true;
        startX=e.clientX;
        startScroll=carousel.scrollLeft;
        lastX=e.clientX;
        lastT=performance.now();
        vel=0;
        carousel.style.scrollSnapType="none";
    };
    window.onpointermove = e=>{
        if(!isDown) return;
        const dx=e.clientX-startX;
        carousel.scrollLeft=startScroll - dx;

        const now = performance.now();
        const dt = now - lastT;
        vel = (e.clientX - lastX) / dt;

        lastX = e.clientX;
        lastT = now;

        applyTilt(e.clientX);
    };
    window.onpointerup = ()=>{
        if(!isDown) return;
        isDown=false;
        carousel.style.scrollSnapType="x mandatory";
        resetTilt();

        const nearest = nearestIndex();
        let target = nearest;

        if(Math.abs(vel)>0.25){
            target = vel < 0 ? nearest+1 : nearest-1;
        }
        target = Math.max(0, Math.min(cards.length-1,target));
        scrollToIndex(target);
    };

    function nearestIndex(){
        let id=0, mind=99999;
        cards.forEach((c,i)=>{
            const r=c.getBoundingClientRect();
            const d = Math.abs(r.left+r.width/2 - innerWidth/2);
            if(d < mind){ mind=d; id=i; }
        });
        return id;
    }

    function scrollToIndex(i){
        const card = cards[i];
        const rect = card.getBoundingClientRect();
        const target = carousel.scrollLeft + (rect.left + rect.width/2 - window.innerWidth/2);
        smoothScroll(carousel, target, 400);
    }

    function smoothScroll(el,to,dur){
        const start=el.scrollLeft;
        const change=to-start;
        const t0=performance.now();

        function anim(){
            const t = Math.min(1,(performance.now()-t0)/dur);
            const ease = 1 - Math.pow(1-t,3);
            el.scrollLeft = start + change*ease;
            updateActive();
            if(t<1) requestAnimationFrame(anim);
        }
        anim();
    }

    /* ===============================
       TILT 3D
    =============================== */
    function applyTilt(x){
        const mid = window.innerWidth/2;
        const dx = (x-mid)/mid;

        cards.forEach(c=>{
            const r=c.getBoundingClientRect();
            const center = r.left+r.width/2;
            const dist = Math.abs(center-mid);
            if(dist < window.innerWidth*0.7){
                const strength = 10*(1 - dist/(window.innerWidth*0.7));
                c.style.transform=`perspective(900px) rotateY(${dx*strength}deg)`;
            }
        });
    }

    function resetTilt(){
        cards.forEach(c=> c.style.transform="");
    }

    /* ===============================
       RESIZE
    =============================== */
    window.onresize = ()=> scrollToIndex(nearestIndex());

    /* ===============================
       MÚSICA
    =============================== */
    const musicBtn=document.createElement("button");
    musicBtn.className="music-toggle";
    musicBtn.textContent="🎵 Activar música";
    document.body.appendChild(musicBtn);

    const audio=new Audio("eres.mp3");
    audio.loop=true;
    audio.volume=0.18;

    let playing=false;
    musicBtn.onclick = async()=>{
        if(!playing){
            try{
                await audio.play();
                playing=true;
                musicBtn.textContent="🔊 Música activada";
            } catch(e){ console.log(e); }
        } else {
            audio.pause();
            playing=false;
            musicBtn.textContent="🎵 Activar música";
        }
    };

    /* ===============================
        DETECTOR DE FIN DE SCROLL
    =============================== */
    let scrollTimeout;

    carousel.addEventListener("scroll", () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        updateActive(); // <-- Ahora sí, emojis cambian con la tarjeta real
         }, 120);
    });


});
