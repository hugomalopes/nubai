// this is just a MVP built in a week, do not expect a treaty on software engineering
// if you are reading this, proceed with caution and at your own risk!

const localization_json = {
    "pt":{
        "header1": "Nu bai na América do Sul",
        "header2": "Bora? Vamos? Let's go! <b>Nu bai!</b>",
        "header3": "Vem connosco, sem filtros nem segundos contados...",
        "travellers": "Em viagem:",
        "language": "Língua:",
        "route": "Percurso",
        "lastupdate": "Última actualização",
        "photo": "Foto",
        "chat": "Fala connosco",
        "about": "Sobre o local",
        "countries": "Países visitados:",
        "distance": "Distância percorrida:",
        "timeline": "Linha cronológica:"
    },
    "en": {
        "header1": "Nu bai to South America",
        "header2": "Come on? Let's go? <b>Nu bai!</b>",
        "header3": "Come with us, without filters nor evanescent stories...",
        "travellers": "On travel:",
        "language": "Language:",
        "route": "Route",
        "lastupdate": "Last update",
        "photo": "Photo",
        "chat": "Chat with us",
        "about": "About the place",
        "countries": "Visited countries:",
        "distance": "Travelled distance:",
        "timeline": "Timeline:"
    }
};

// get pastebin raw data through allorigins to bypass CORS
// ?nocache=${Date.now()} is used to bypasse allorigins cache system
let pastebin_url = 'https://pastebin.com/raw/';
let pastebin_slug = 'KN2C7NZL';
let pastesio_url = 'https://pastes.io/raw/';
let pastesio_slug = 'zcpl2vbrqk';
let config_json_url = `https://api.allorigins.win/get?url=${encodeURIComponent(pastebin_url + pastebin_slug)}?nocache=${Date.now()}`;

function atou(b64) {
    return decodeURIComponent(escape(atob(b64)));
}

// haversine formula to determinate the great-circle distance between coordinates
// kudos to https://stackoverflow.com/questions/18883601/function-to-calculate-distance-between-two-coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2-lat1);  // deg2rad below
  var dLon = deg2rad(lon2-lon1);
  var a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
    ;
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  var d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

function img_fullscreen_modal(src) {
    var img = document.getElementById("img-fullscreen-modal");
    img.src = src;
}

function wikipedia_summary(address_json) {
    var address_level_list = ["hamlet", "town", "city", "country"];
    var wiki_query_list = [];
    address_level_list.forEach( al => {
        if (al in address_json) {
            wiki_query_list.push(address_json[al].replaceAll(" ", "+"));
        }
    });
    var wiki_query = wiki_query_list.join("+");

    var wiki_search_url = `https://${banana.locale}.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${wiki_query}`;
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(wiki_search_url)}`)
    .then(wiki_search_res => wiki_search_res.json())
    .then(wiki_search_allorigins_json => {
        var wiki_search_json = JSON.parse(wiki_search_allorigins_json.contents);
        if (wiki_search_json["query"]["search"]) {
            var wiki_first_result = wiki_search_json["query"]["search"][0];
            // var wiki_summary_alt = `https://${banana.locale}.wikipedia.org/api/rest_v1/page/summary/<title>`
            var wiki_summary_url = `https://${banana.locale}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&pageids=${wiki_first_result.pageid}&explaintext=true&exintro=true`;
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(wiki_summary_url)}`)
            .then(wiki_summary_res => wiki_summary_res.json())
            .then(wiki_summary_allorigins_json => {
                var wiki_summary_json = JSON.parse(wiki_summary_allorigins_json.contents);
                if (wiki_summary_json["query"]["pages"][wiki_first_result.pageid]["extract"]) {
                    // fill img div with photo
                    var wiki_div = document.getElementById('wikipedia-info');
                    wiki_div.innerHTML = `
                    <p>${wiki_summary_json["query"]["pages"][wiki_first_result.pageid]["extract"]}</p>
                    <p>↳<a target='_blank' href='https://${banana.locale}.wikipedia.org/?curid=${wiki_first_result.pageid}'>Wikipedia</a></p>`;
                }
            })
            .catch(err => {
                console.log("Wikipedia summary failed: ", err);
                throw err;
            });
        }
    })
    .catch(err => {
        console.log("Wikipedia search failed: ", err);
        throw err;
    });
}

function translate(locale) {
    banana.setLocale(locale);

    var localizable_elements = document.querySelectorAll("[id^='banana-i18n-']");
    localizable_elements.forEach(le => {
        le.innerHTML = banana.i18n(le.dataset.i18n);  // a property data-<something> in HTML is accessible as dataset.<something>
    })

    wikipedia_summary(selected_address);
}


// initialize webpage localization
const banana = new Banana("pt");
banana.load(localization_json, banana.locale);
let localizable_elements = document.querySelectorAll("[id^='banana-i18n-']");
localizable_elements.forEach(le => {
    le.innerHTML = banana.i18n(le.dataset.i18n);  // a property data-<something> in HTML is accessible as dataset.<something>
});

let selected_address = {};  // useful to reload wikipedia info with new lang

// add function to language flag icons
let language_flag_elements = document.querySelectorAll("[id^='language-flag-']");
language_flag_elements.forEach(lfe => {
    lfe.addEventListener('click', () => {
        translate(lfe.dataset.lang);
    });
});

fetch(config_json_url)
.then(res => res.json())
.then(allorigins_json => {
    // console.log(config_json_url);
    // console.log(JSON.stringify(allorigins_json));
    // parse base64 json config file (which contains ghost white spaces in between)
    let config_json = JSON.parse(atou(allorigins_json.contents.replaceAll(' ', '')));  // apparently, atob can parse white spaces too

    // populating page with config data

    // adding travellers to travel list
    config_json.traveller_list.forEach(t => {
        let placeholder_div = document.getElementById("traveller-list");
        let div = document.createElement('div');
        div.classList.add('traveller');
        div.classList.add('col-sm-2');
        div.classList.add('traveller-div-width');
        let a = document.createElement('a');
        a.href = t.url;
        a.target = '_blank';  // open link in new tab
        let img = document.createElement('img');
        img.classList.add('img-fluid');
        img.classList.add('rounded-circle');
        img.src = t.image_url;
        img.alt = t.name;
        img.title = t.name;

        a.appendChild(img);
        div.appendChild(a);
        placeholder_div.appendChild(div);
    });

    // last update info
    let last_update_date = new Date(config_json.last_update_time);
    let last_update_p = document.createElement('p');
    last_update_p.innerText = last_update_date.toLocaleString();
    let map_div = document.getElementById('map-div');
    map_div.appendChild(last_update_p);

    // statistics
    var visited_countries_list = [];
    var last_coordinates = {};  // to be used in the following forEach loop
    var travelled_km_estimate = 0;

    // parsing photos list
    var latlngs = [];
    config_json.photo_list.sort( (a, b) => {
        return a.creation_date_ms - b.creation_date_ms;
    });  // sorting photos by date
    config_json.photo_list.forEach( (p, index, array) => {
        // resolving different p.address keys for different geographical organizations
        var address_local_id_list = ["hamlet", "town", "city_district", "city"];
        var address_local_found_list = [];
        address_local_id_list.forEach( al => {
            if (al in p.address) {
                address_local_found_list.push(p.address[al]);
            }
        });
        var address_local = address_local_found_list.join(", ");

        var address_state_county_id_list = ["county", "state", "archipelago"];
        var address_state_county_found_list = [];
        address_state_county_id_list.forEach( al => {
            if (al in p.address) {
                address_state_county_found_list.push(p.address[al]);
            }
        });
        var address_state_county = address_state_county_found_list.join(", ");

        var photo_date = new Date(p.creation_date_ms * 1000);  // seconds to ms
        var photo_date_str = photo_date.toLocaleString();

        // adding coordinate markers
        var marker = L.marker([p.gps_latitude, p.gps_longitude]).addTo(map);
        var popup_html = `
            <a data-bs-toggle="modal" data-bs-target="#div-fullscreen-modal" onclick="img_fullscreen_modal('${p.imgbox_url}')">
                <img class="img-fluid mouse-hand-pointer" src="${p.imgbox_url}" alt="selected-photo">
            </a>
            <br>
            ${photo_date_str}
            `;
        marker.bindPopup(popup_html);
        marker.on('click', function() {
            // fill img div with photo
            var image_div = document.getElementById('selected-photo');
            image_div.innerHTML = `
            <a data-bs-toggle="modal" data-bs-target="#div-fullscreen-modal" onclick="img_fullscreen_modal('${p.imgbox_url}')">
                <img class="img-fluid mouse-hand-pointer" src="${p.imgbox_url}" alt="selected-photo">
            </a>
            <p>${p.text}</p>
            <p>${photo_date_str}, ${address_local}, ${address_state_county}, ${p.address.country}</p>`;

            selected_address = p.address;  // useful to reload wikipedia info with new lang
            wikipedia_summary(p.address);
        });

        // stats
        if (!visited_countries_list.includes(p.address.country)) {
            visited_countries_list.push(p.address.country);
        }
        if (Object.keys(last_coordinates).length > 0) {
            current_route_leg_distance = getDistanceFromLatLonInKm(last_coordinates.lat, last_coordinates.lon, p.gps_latitude, p.gps_longitude);
            travelled_km_estimate += current_route_leg_distance;
        }
        last_coordinates = {
            lat: p.gps_latitude,
            lon: p.gps_longitude
        };
        var stats_timeline_table = document.getElementById('stats-timeline-table');
        stats_timeline_table.innerHTML += `
            <tr>
              <td class="border-dark border-end text-end">${photo_date_str}</td>
              <td class="text-start col-md-7">${address_local}, ${address_state_county}, ${p.address.country}</td>
            </tr>
        `;

        latlngs.push([p.gps_latitude, p.gps_longitude]);

        if (index === array.length - 1) {
            marker.fire('click');
        }
    });

    // fill stats container
    var stats_visited_countries = document.getElementById('stats-visited-countries');
    stats_visited_countries.innerHTML = visited_countries_list.join(", ");
    var stats_travelled_distance = document.getElementById('stats-travelled-distance');
    stats_travelled_distance.innerHTML = `${Math.round(travelled_km_estimate)} km`;

    var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
    // zoom the map to the polyline
    // map.fitBounds(polyline.getBounds());
    // zoom to the last position
    map.flyTo(
      latlngs[latlngs.length - 1],
      18,
      {
        animate: true,
        duration: 1.5
      }
    );
})
.catch(err => {
    throw err;
});

// leafletjs map
var map = L.map('map').setView([38.999, -9.19], 6);  // starts near Lisbon

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);
