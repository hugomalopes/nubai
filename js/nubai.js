// this is just a MVP built in a week, do not expect a treaty on software engineering
// if you are reading this, proceed with caution and at your own risk!

// get pastebin raw data through allorigins to bypass CORS
// ?nocache=${Date.now()} is used to bypasse allorigins cache system
let config_json_url = `https://api.allorigins.win/get?url=${encodeURIComponent('https://pastebin.com/raw/WWSYFdfQ')}?nocache=${Date.now()}`;

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

    var wiki_search_url = `https://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${wiki_query}`;
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(wiki_search_url)}`)
    .then(wiki_search_res => wiki_search_res.json())
    .then(wiki_search_allorigins_json => {
        var wiki_search_json = JSON.parse(wiki_search_allorigins_json.contents);
        if (wiki_search_json["query"]["search"]) {
            var wiki_first_result = wiki_search_json["query"]["search"][0];
            // var wiki_summary_alt = `https://en.wikipedia.org/api/rest_v1/page/summary/<title>`
            var wiki_summary_url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&pageids=${wiki_first_result.pageid}&explaintext=true&exintro=true`;
            fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(wiki_summary_url)}`)
            .then(wiki_summary_res => wiki_summary_res.json())
            .then(wiki_summary_allorigins_json => {
                var wiki_summary_json = JSON.parse(wiki_summary_allorigins_json.contents);
                if (wiki_summary_json["query"]["pages"][wiki_first_result.pageid]["extract"]) {
                    // fill img div with photo
                    var wiki_div = document.getElementById('wikipedia-info');
                    wiki_div.innerHTML = `
                    <p>${wiki_summary_json["query"]["pages"][wiki_first_result.pageid]["extract"]}</p>
                    <p>↳<a target='_blank' href='https://en.wikipedia.org/?curid=${wiki_first_result.pageid}'>Wikipedia</a></p>`;
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


fetch(config_json_url)
.then(res => res.json())
.then(allorigins_json => {
    // console.log(config_json_url);
    // console.log(JSON.stringify(allorigins_json));

    let config_json = JSON.parse(allorigins_json.contents);

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

    // parsing photos list
    var latlngs = [];
    config_json.photo_list.forEach( (p, index, array) => {
        // adding coordinate markers
        var marker = L.marker([p.gps_latitude, p.gps_longitude]).addTo(map);
        marker.on('click', function() {
            var address_local_id_list = ["hamlet", "town", "city"];
            var address_local_found_list = [];
            address_local_id_list.forEach( al => {
                if (al in p.address) {
                    address_local_found_list.push(p.address[al]);
                }
            });
            var address_local = address_local_found_list.join(", ");

            // fill img div with photo
            var image_div = document.getElementById('selected-photo');
            image_div.innerHTML = `
            <a data-bs-toggle="modal" data-bs-target="#div-fullscreen-modal" onclick="img_fullscreen_modal('${p.imgbox_url}')">
                <img class="img-fluid" src="${p.imgbox_url}" alt="selected-photo">
            </a>
            <p>${p.text}</p>
            <p>${p.gps_date_stamp}, ${address_local}, ${p.address.county}, ${p.address.country}</p>`;

            wikipedia_summary(p.address);
        })
        latlngs.push([p.gps_latitude, p.gps_longitude]);

        if (index === array.length - 1) {
            marker.fire('click');
        }

    });
    var polyline = L.polyline(latlngs, {color: 'red'}).addTo(map);
    // zoom the map to the polyline
    map.fitBounds(polyline.getBounds());

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
