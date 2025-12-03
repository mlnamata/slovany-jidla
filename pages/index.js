import {useState, useMemo} from 'react'
import Head from 'next/head'
import menu from '../data/menu.json'

// převod čísla dne z js (0-6) na český název
function getCzechWeekday(d){
  const names = ['Neděle','Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota']
  // posun indexů, aby odpovídaly českému týdnu
  return names[d.getDay() === 0 ? 6 : d.getDay() - 1]
}

// formátování data na dd.mm.yyyy
function formatLocalDate(d){
  const dd = String(d.getDate()).padStart(2,'0')
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export default function Home(){
  // stav přepínače: zobrazit vše (true) nebo jen dnes (false)
  const [showFullWeek, setShowFullWeek] = useState(false)

  // uložení dnešního data, aby se nepočítalo při každém překreslení
  const today = useMemo(()=> new Date(), [])
  const todayName = getCzechWeekday(today)
  const todayLabel = `${todayName} ${today.getDate()}.${today.getMonth()+1}.`

  // funkce ověřující, zda text dne v jsonu odpovídá dnešku
  function matchesTodayLabel(dayLabel){
    if(!dayLabel) return false

    // odstranění mezer a neviditelných znaků
    const normalize = s => String(s).replace(/\u00A0/g,' ').replace(/[\u200E\u200F]/g,'').trim()
    const nl = normalize(dayLabel)

    // kontrola, zda je popisek jen číslo (index dne)
    if(/^\d+$/.test(nl)){
      const idx = parseInt(nl,10)
      const idxNames = ['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle']
      if(idx >= 0 && idx < idxNames.length) return idxNames[idx] === todayName
    }

    // hledání názvu dne (např. "pátek") uvnitř textu
    try{
      const re = new RegExp('\\b'+todayName+'\\b','i')
      if(re.test(nl)) return true
    }catch(e){/* chyba regexu, ignorujeme */}

    // hledání konkrétního čísla data (např. "28.")
    const m = nl.match(/(\d{1,2})\b/) 
    if(m){
      const num = parseInt(m[1],10)
      if(!Number.isNaN(num)) return num === today.getDate()
    }

    return false
  }

  return (
    <>
      <Head>
        <title>Jídelní lístek — Next.js</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="container">
        <header className="site-header">
          <div className="title-block">
            <h1>Týdenní jídelníček</h1>
            <div className="meta">{menu.week_range} · Aktualizováno: {menu.last_updated}</div>
            <div className="meta" style={{marginTop:6}}>Dnes: <strong>{todayName}</strong> — {formatLocalDate(today)}</div>
          </div>

          <div style={{textAlign:'right'}}>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              {/* tlačítko pro přepínání zobrazení dne/týdne */}
              <button onClick={()=>setShowFullWeek(s=>!s)} style={{padding:'6px 10px',borderRadius:8,border:'1px solid var(--border)',background:showFullWeek? 'linear-gradient(90deg, #eef2ff, #fff)' : 'transparent',cursor:'pointer'}}> {showFullWeek ? 'Zobrazit pouze dnes' : 'Zobrazit celý týden'}</button>
              <div className="badge">{menu.restaurants.length} restaurace</div>
            </div>
          </div>
        </header>

        <div className="restaurants">
          {menu.restaurants.map((r) => {
            // filtrace dnů: buď všechny, nebo jen ty odpovídající dnešku
            const days = showFullWeek ? r.weekly_menu : (r.weekly_menu || []).filter(d => d.day && matchesTodayLabel(d.day))

            return (
              <article className="card" key={r.restaurant_id}>
                <h2>{r.restaurant_name} {r.error ? <span style={{color:'#ef4444',fontSize:'0.9rem'}}>— chyba</span> : null}</h2>
        

                {/* pokud je chyba stahování */}
                {r.error ? (
                  <div className="day"><em>Menu není dostupné.</em></div>
                ) : (
                  // pokud jsou data k zobrazení
                  days && days.length > 0 ? (
                    days.map((day) => (
                      <div className="day" key={day.day}>
                        <div className="day-grid">
                          <div className="day-name">
                            <h3>{day.day}</h3>
                          </div>

                          <div className="day-content">
                            <div className="lists">
                              <div className="list">
                                <strong>Polévky</strong>
                                <ul>
                                  {/* výpis polévek nebo pomlčky */}
                                  {day.soups && day.soups.length > 0 ? day.soups.map((s,i)=> <li key={i}>{s.name}{s.price ? ` — ${s.price}` : ''}</li>) : <li>—</li>}
                                </ul>
                              </div>

                              <div className="list">
                                <strong>Hlavní jídla</strong>
                                <ul>
                                  {/* výpis hlavních jídel nebo pomlčky */}
                                  {day.mains && day.mains.length > 0 ? day.mains.map((m,i)=> <li key={i}>{m.name}{m.price ? ` — ${m.price}` : ''}</li>) : <li>—</li>}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // pokud filtr nic nenašel (např. o víkendu)
                    <div className="day"><em>Menu pro dnešek není dostupné.</em></div>
                  )
                )}
              </article>
            )
          })}
        </div>
      </div>
    </>
  )
}
