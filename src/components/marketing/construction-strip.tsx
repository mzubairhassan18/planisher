export function ConstructionStrip() {
  return (
    <div className="construction-strip" aria-label="An animated construction site">
      <svg viewBox="0 0 1200 320" role="img" aria-labelledby="site-title site-desc">
        <title id="site-title">A Planisher construction site in motion</title>
        <desc id="site-desc">
          A truck moves past a worker digging and another worker hammering a timber frame.
        </desc>
        <path className="site-ground" d="M0 264h1200v56H0z" />
        <g className="site-skyline" opacity=".28">
          <path d="M70 264v-82h75v82M160 264v-120h92v120M890 264V122h110v142M1018 264v-96h90v96" />
        </g>
        <g className="site-truck">
          <path d="M38 202h126l38 32h42v37H38z" />
          <path d="M164 202v32h38z" className="truck-window" />
          <circle cx="83" cy="271" r="20" />
          <circle cx="205" cy="271" r="20" />
          <circle cx="83" cy="271" r="7" className="wheel-hub" />
          <circle cx="205" cy="271" r="7" className="wheel-hub" />
        </g>
        <g className="site-worker site-digger">
          <circle cx="474" cy="170" r="17" />
          <path d="M463 190l-18 55m30-51 20 45m-36-20 32 4" />
          <path className="site-tool" d="M503 180l-48 95m38-72 29 58" />
        </g>
        <g className="site-frame">
          <path d="M694 264V137m128 127V137M684 151h148M699 207h118" />
        </g>
        <g className="site-worker site-hammerer">
          <circle cx="763" cy="164" r="17" />
          <path d="M756 182l-9 55m19-49 27 24m-42 18-22 34m23-29 25 29" />
          <g className="hammer-arm">
            <path d="M765 190l30-29" />
            <path className="site-tool" d="M789 155l20 18m-11-9 15-15" />
          </g>
        </g>
        <g className="site-plans">
          <rect x="973" y="215" width="91" height="55" rx="6" />
          <path d="M987 232h55m-55 13h38m-38 13h50" />
        </g>
      </svg>
    </div>
  );
}
