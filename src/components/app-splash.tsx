import { ZeroMark } from "@/components/zero-mark";

const NAME = "AGENCY ZERO";

/**
 * Opening screen for the CRM: black, the zero draws itself, the name rises letter by letter, then it fades
 * away. Pure CSS, so it is on screen from the very first paint (no flash of an empty page) and needs no
 * JavaScript. It plays on a full load only; moving between sections never replays it. Once per browser session.
 */
export function AppSplash() {
  return (
    <>
      <script
        // Runs before first paint: skip the intro if it already played in this tab.
        dangerouslySetInnerHTML={{
          __html: `try{if(sessionStorage.getItem('az-splash')){document.documentElement.setAttribute('data-splash','seen')}else{sessionStorage.setItem('az-splash','1')}}catch(e){}`,
        }}
      />
      <div className="app-splash" aria-hidden>
        <div className="app-splash-inner">
          <ZeroMark className="app-splash-mark" draw />
          <p className="app-splash-name">
            {NAME.split("").map((letter, index) => (
              <span key={index} style={{ "--i": index } as React.CSSProperties}>
                {letter === " " ? " " : letter}
              </span>
            ))}
          </p>
          <span className="app-splash-line" />
        </div>
      </div>
    </>
  );
}
