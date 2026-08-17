/* ===========================================================
   Borough Line — client logic
   Talks to the FastAPI /predict endpoint from Model_Pipeline.pkl
   =========================================================== */

// All 217 neighbourhoods the model's OneHotEncoder was fit on.
const NEIGHBOURHOODS = ["Allerton", "Arden Heights", "Arrochar", "Arverne", "Astoria", "Bath Beach", "Battery Park City", "Bay Ridge", "Bay Terrace", "Bay Terrace, Staten Island", "Baychester", "Bayside", "Bayswater", "Bedford-Stuyvesant", "Belle Harbor", "Bellerose", "Belmont", "Bensonhurst", "Bergen Beach", "Boerum Hill", "Borough Park", "Breezy Point", "Briarwood", "Brighton Beach", "Bronxdale", "Brooklyn Heights", "Brownsville", "Bull's Head", "Bushwick", "Cambria Heights", "Canarsie", "Carroll Gardens", "Castle Hill", "Castleton Corners", "Chelsea", "Chinatown", "City Island", "Civic Center", "Claremont Village", "Clason Point", "Clifton", "Clinton Hill", "Co-op City", "Cobble Hill", "College Point", "Columbia St", "Concord", "Concourse", "Concourse Village", "Coney Island", "Corona", "Crown Heights", "Cypress Hills", "DUMBO", "Ditmars Steinway", "Dongan Hills", "Douglaston", "Downtown Brooklyn", "Dyker Heights", "East Elmhurst", "East Flatbush", "East Harlem", "East Morrisania", "East New York", "East Village", "Eastchester", "Edenwald", "Edgemere", "Elmhurst", "Eltingville", "Emerson Hill", "Far Rockaway", "Fieldston", "Financial District", "Flatbush", "Flatiron District", "Flatlands", "Flushing", "Fordham", "Forest Hills", "Fort Greene", "Fort Hamilton", "Fresh Meadows", "Glendale", "Gowanus", "Gramercy", "Graniteville", "Grant City", "Gravesend", "Great Kills", "Greenpoint", "Greenwich Village", "Grymes Hill", "Harlem", "Hell's Kitchen", "Highbridge", "Hollis", "Holliswood", "Howard Beach", "Howland Hook", "Huguenot", "Hunts Point", "Inwood", "Jackson Heights", "Jamaica", "Jamaica Estates", "Jamaica Hills", "Kensington", "Kew Gardens", "Kew Gardens Hills", "Kingsbridge", "Kips Bay", "Laurelton", "Little Italy", "Little Neck", "Long Island City", "Longwood", "Lower East Side", "Manhattan Beach", "Marble Hill", "Mariners Harbor", "Maspeth", "Melrose", "Middle Village", "Midland Beach", "Midtown", "Midwood", "Mill Basin", "Morningside Heights", "Morris Heights", "Morris Park", "Morrisania", "Mott Haven", "Mount Eden", "Mount Hope", "Murray Hill", "Navy Yard", "Neponsit", "New Brighton", "New Dorp", "New Dorp Beach", "New Springville", "NoHo", "Nolita", "North Riverdale", "Norwood", "Oakwood", "Olinville", "Ozone Park", "Park Slope", "Parkchester", "Pelham Bay", "Pelham Gardens", "Port Morris", "Port Richmond", "Prince's Bay", "Prospect Heights", "Prospect-Lefferts Gardens", "Queens Village", "Randall Manor", "Red Hook", "Rego Park", "Richmond Hill", "Ridgewood", "Riverdale", "Rockaway Beach", "Roosevelt Island", "Rosebank", "Rosedale", "Rossville", "Schuylerville", "Sea Gate", "Sheepshead Bay", "Shore Acres", "Silver Lake", "SoHo", "Soundview", "South Beach", "South Ozone Park", "South Slope", "Springfield Gardens", "Spuyten Duyvil", "St. Albans", "St. George", "Stapleton", "Stuyvesant Town", "Sunnyside", "Sunset Park", "Theater District", "Throgs Neck", "Todt Hill", "Tompkinsville", "Tottenville", "Tremont", "Tribeca", "Two Bridges", "Unionport", "University Heights", "Upper East Side", "Upper West Side", "Van Nest", "Vinegar Hill", "Wakefield", "Washington Heights", "West Brighton", "West Farms", "West Village", "Westchester Square", "Westerleigh", "Whitestone", "Williamsbridge", "Williamsburg", "Willowbrook", "Windsor Terrace", "Woodhaven", "Woodlawn", "Woodside"];

// Classes the model was trained on, in the exact order predict_proba returns them.
const CLASS_ORDER = ["Entire home/apt", "Private room", "Shared room"];
const CLASS_COLOR = {
  "Entire home/apt": "var(--yellow)",
  "Private room":    "var(--teal)",
  "Shared room":     "var(--coral)",
};

// Populate the neighbourhood datalist once.
const datalist = document.getElementById("neighbourhood-list");
datalist.innerHTML = NEIGHBOURHOODS.map(n => `<option value="${n}"></option>`).join("");

const form        = document.getElementById("predict-form");
const submitBtn   = document.getElementById("submit-btn");
const errorEl     = document.getElementById("form-error");

const resultEmpty   = document.getElementById("result-empty");
const resultLoading = document.getElementById("result-loading");
const resultDone    = document.getElementById("result-done");
const headlineEl    = document.getElementById("result-headline");
const barsEl        = document.getElementById("result-bars");

function showState(state){
  resultEmpty.hidden   = state !== "empty";
  resultLoading.hidden = state !== "loading";
  resultDone.hidden    = state !== "done";
}

function fieldNum(id){
  const v = document.getElementById(id).value;
  return v === "" ? null : Number(v);
}

function buildPayload(){
  return {
    latitude: fieldNum("latitude"),
    longitude: fieldNum("longitude"),
    price: fieldNum("price"),
    minimum_nights: fieldNum("minimum_nights"),
    number_of_reviews: fieldNum("number_of_reviews"),
    reviews_per_month: fieldNum("reviews_per_month"),
    calculated_host_listings_count: fieldNum("calculated_host_listings_count"),
    availability_365: fieldNum("availability_365"),
    neighbourhood_group: document.getElementById("neighbourhood_group").value,
    neighbourhood: document.getElementById("neighbourhood").value,
  };
}

function renderResult(data){
  const predicted = data.Predicted_room_type;
  const probs = data.Probability; // array aligned to CLASS_ORDER

  headlineEl.textContent = predicted;
  headlineEl.style.color = CLASS_COLOR[predicted] || "var(--text)";

  // Pair classes with probabilities, sort high -> low.
  const rows = CLASS_ORDER.map((cls, i) => ({ cls, p: probs[i] ?? 0 }))
    .sort((a, b) => b.p - a.p);

  barsEl.innerHTML = rows.map(({ cls, p }) => {
    const pct = Math.round(p * 1000) / 10; // one decimal
    const color = CLASS_COLOR[cls] || "var(--text-muted)";
    return `
      <div class="bar-row">
        <div class="bar-row__top">
          <span class="bar-row__label"><span class="bar-row__chip" style="background:${color}"></span>${cls}</span>
          <span class="bar-row__pct">${pct}%</span>
        </div>
        <div class="bar-track">
          <div class="bar-fill" style="background:${color}; width:0%"></div>
        </div>
      </div>`;
  }).join("");

  showState("done");

  // animate bars in on next frame
  requestAnimationFrame(() => {
    barsEl.querySelectorAll(".bar-fill").forEach((el, i) => {
      el.style.width = `${rows[i].p * 100}%`;
    });
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorEl.textContent = "";

  const neighbourhoodGroup = document.getElementById("neighbourhood_group").value;
  const neighbourhood = document.getElementById("neighbourhood").value.trim();

  if (!neighbourhoodGroup) {
    errorEl.textContent = "Pick a borough first.";
    return;
  }
  if (!neighbourhood) {
    errorEl.textContent = "Enter a neighbourhood.";
    return;
  }

  const apiBase = document.getElementById("api-base").value.trim().replace(/\/+$/, "");
  if (!apiBase) {
    errorEl.textContent = "Set the FastAPI base URL under 'API endpoint'.";
    return;
  }

  submitBtn.disabled = true;
  showState("loading");

  try {
    const res = await fetch(`${apiBase}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Server responded ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    renderResult(data);
  } catch (err) {
    showState("empty");
    errorEl.textContent = `Couldn't reach the model — ${err.message}. Is the FastAPI server running at that URL, and is CORS enabled?`;
  } finally {
    submitBtn.disabled = false;
  }
});
