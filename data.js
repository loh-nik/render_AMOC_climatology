/* ============================================================
   CLIMATE GLOBE — DATA FILE
   ------------------------------------------------------------
   This is the ONLY file you need to regenerate/replace when you
   get new data. index.html never changes.

   Structure:

   window.CLIMATE_DATA = {
     heatmap: {
       nlat: 300, nlon: 300,
       latMin, latMax, lonMin, lonMax,   // bounding box of the grid
       values: [[...300 numbers...], ... 300 rows ...]  // row 0 = latMax (north)
     },
     cities: [
       { id, name, lat, lon }, ...
     ],
     // one entry per city.id
     cityData: {
       "<city id>": {
         months: ["Jan",...,"Dec"],
         models: ["Model A", "Model B"],           // exactly 2
         scenarios: ["Scenario 1", "Scenario 2"],  // exactly 2
         // climatology: per model+scenario, per month: tas/tasmin/tasmax
         climatology: {
           "Model A|Scenario 1": { tas:[12], tasmin:[12], tasmax:[12] },
           "Model A|Scenario 2": { ... },
           "Model B|Scenario 1": { ... },
           "Model B|Scenario 2": { ... }
         },
         // anomaly: scenario2 - scenario1, per model, per month, per var
         anomaly: {
           "Model A": { tas:[12], tasmin:[12], tasmax:[12] },
           "Model B": { tas:[12], tasmin:[12], tasmax:[12] }
         },
         // return periods: 6 named panels, each a Gumbel-fit curve
         // at T = [2,5,10,20,50,100] years, per case
         returnPeriods: {
           T: [2,5,10,20,50,100],
           panels: {
             "Hottest day of year":   { kind:"max", curves:{ "Model A|Scenario 1":[6nums], ... } },
             "Coldest day of year":   { kind:"min", curves:{ ... } },
             "Hottest summer mean":   { kind:"max", curves:{ ... } },
             "Coldest winter mean":   { kind:"min", curves:{ ... } },
             "Warmest annual mean":   { kind:"max", curves:{ ... } },
             "Coldest annual mean":   { kind:"min", curves:{ ... } }
           }
         }
       }
     }
   }
   ============================================================ */

(function () {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const CASES = ["Model A|Scenario 1","Model A|Scenario 2","Model B|Scenario 1","Model B|Scenario 2"];
  const T = [2,5,10,20,50,100];

  // ---- tiny deterministic fake-data generator, just so the demo renders ----
  function seeded(seed) {
    let s = seed;
    return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function makeClimatology(rng, base) {
    const tas = MONTHS.map((_, i) => +(base + 10 * Math.sin((i - 3) / 12 * 2 * Math.PI) + (rng() - 0.5) * 1.5).toFixed(2));
    const tasmin = tas.map(v => +(v - 3 - rng() * 2).toFixed(2));
    const tasmax = tas.map(v => +(v + 3 + rng() * 2).toFixed(2));
    return { tas, tasmin, tasmax };
  }
  function makeReturnCurve(rng, base, kind) {
    const dir = kind === "max" ? 1 : -1;
    return T.map(t => +(base + dir * (2 + Math.log(t) * 2.2) + (rng() - 0.5)).toFixed(2));
  }
  function buildCity(seedNum, baseTemp) {
    const rng = seeded(seedNum);
    const climatology = {};
    CASES.forEach((c, i) => { climatology[c] = makeClimatology(rng, baseTemp + i * 0.6); });

    const anomaly = {};
    ["Model A", "Model B"].forEach(m => {
      const s1 = climatology[`${m}|Scenario 1`], s2 = climatology[`${m}|Scenario 2`];
      anomaly[m] = {
        tas: s2.tas.map((v, i) => +(v - s1.tas[i]).toFixed(2)),
        tasmin: s2.tasmin.map((v, i) => +(v - s1.tasmin[i]).toFixed(2)),
        tasmax: s2.tasmax.map((v, i) => +(v - s1.tasmax[i]).toFixed(2)),
      };
    });

    const panelDefs = [
      ["Hottest day of year", "max", baseTemp + 18],
      ["Coldest day of year", "min", baseTemp - 18],
      ["Hottest summer mean", "max", baseTemp + 10],
      ["Coldest winter mean", "min", baseTemp - 10],
      ["Warmest annual mean", "max", baseTemp + 3],
      ["Coldest annual mean", "min", baseTemp - 3],
    ];
    const panels = {};
    panelDefs.forEach(([name, kind, base]) => {
      const curves = {};
      CASES.forEach((c, i) => { curves[c] = makeReturnCurve(rng, base + i * 0.5, kind); });
      panels[name] = { kind, curves };
    });

    return {
      months: MONTHS,
      models: ["Model A", "Model B"],
      scenarios: ["Scenario 1", "Scenario 2"],
      climatology,
      anomaly,
      returnPeriods: { T, panels },
    };
  }

  // ---- demo heatmap: smooth 300x300 field so the toggle has something to show ----
  function buildHeatmap() {
    const nlat = 300, nlon = 300;
    const values = new Array(nlat);
    for (let i = 0; i < nlat; i++) {
      const lat = 90 - (i / (nlat - 1)) * 180;
      const row = new Array(nlon);
      for (let j = 0; j < nlon; j++) {
        const lon = -180 + (j / (nlon - 1)) * 360;
        row[j] = +(15 * Math.cos(lat * Math.PI / 180) - 0.02 * Math.abs(lon) + 3 * Math.sin(lon / 20)).toFixed(2);
      }
      values[i] = row;
    }
    return { nlat, nlon, latMin: -90, latMax: 90, lonMin: -180, lonMax: 180, values };
  }

  const cities = [
    { id: "nyc", name: "New York",  lat: 40.7128, lon: -74.0060 },
    { id: "lon", name: "London",    lat: 51.5074, lon: -0.1278 },
    { id: "syd", name: "Sydney",    lat: -33.8688, lon: 151.2093 },
  ];

  window.CLIMATE_DATA = {
    heatmap: buildHeatmap(),
    cities,
    cityData: {
      nyc: buildCity(1, 12),
      lon: buildCity(2, 10),
      syd: buildCity(3, 18),
    },
  };
})();
