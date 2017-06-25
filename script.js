var models = [
    {
        placename: 'Phoenix Marketcity',
        venueId: "4ea2b2e7722ec75ade643f30",
        selection: false,
        show: true,
        lat: 12.9976,
        lng: 77.6963
    },
    {
        placename: 'VR Mall',
        venueId: "56224801498ee4a64eaffcaa",
        selection: false,
        show: true,
        lat: 12.9963,
        lng: 77.6953
    },
    {
        placename: 'Garuda Mall',
        venueId: "4ba1f6c1f964a520e4d337e3",
        selection: false,
        show: true,
        lat: 12.9700,
        lng: 77.6098
    },
    {
        placename: 'Orion Mall',
        venueId: "4f1869c7e4b0ebf9e4ae9134",
        selection: false,
        show: true,
        lat: 13.0108,
        lng: 77.5549
    },
    {
        placename: 'Mantri Square',
        venueId: "4b8d02aff964a52035e432e3",
        selection: false,
        show: true,
        lat: 12.9917,
        lng: 77.5706
    },
    {
        placename: 'Forum',
        venueId: "4b5a8814f964a5201cca28e3",
        selection: false,
        show: true,
        lat: 12.9345,
        lng: 77.6112
    },
    {
        placename: 'Forum Value Mall',
        venueId: "4b56c960f964a520391b28e3",
        selection: false,
        show: true,
        lat: 12.9596,
        lng: 77.7479
    }
];

var viewModel = function () {
    var self = this;
    self.error = ko.observable('');
    self.place_input = ko.observable('');
    self.selected_place = ko.observableArray([]);

    //this function creates a marker
    self.makeMarkerIcon = function (markerColor) {
        var markerImage = new google.maps.MarkerImage(
            'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor + '|40|_|%E2%80%A2',
            new google.maps.Size(21, 34),
            new google.maps.Point(0, 0),
            new google.maps.Point(10, 34),
            new google.maps.Size(21, 34));
        return markerImage;
    };

    var defaultIcon = self.makeMarkerIcon('0091ff');
    var highlightedIcon = self.makeMarkerIcon('FFFF24');

    models.forEach(function (counter) {
        var marker = new google.maps.Marker({
            placename: counter.placename,
            position: { lat: counter.lat, lng: counter.lng },
            show: ko.observable(counter.show),
            venueId: counter.venueId,
            selection: ko.observable(counter.selection),
            animation: google.maps.Animation.DROP,
            map: map,
            icon: defaultIcon,
            id: 1
        });
        self.selected_place().push(marker);

        marker.addListener('mouseover', function () {
            this.setIcon(highlightedIcon);
        });
        marker.addListener('mouseout', function () {
            this.setIcon(defaultIcon);
        });
        marker.addListener('click', function () {
            self.makeBounce(marker);
            self.populateInfoWindow(this, largeInfowindow);
            self.addApiInfo(marker);
        });

    });
    var largeInfowindow = new google.maps.InfoWindow();
    self.no_places = self.selected_place.length;
    self.current_place = self.selected_place[0];


    self.populateInfoWindow = function (marker, infowindow) {
        //checks if infowindow is already open
        if (infowindow.marker != marker) {
            //clears the infowindow content
            infowindow.setContent();
            infowindow.marker = marker;
            //marker property is cleared if infowindow is closed
            infowindow.addListener('closeclick', function () {
                if (infowindow.marker != null)
                    infowindow.marker.setAnimation(null);
                infowindow.marker = null;

            });

            var streetViewService = new google.maps.StreetViewService();
            var radius = 50;

            self.getStreetView = function (data, status) {
                if (status == google.maps.StreetViewStatus.OK) {

                    var nearStreetViewLocation = data.location.latLng;
                    var heading = google.maps.geometry.spherical.computeHeading(nearStreetViewLocation, marker.position);
                    infowindow.setContent('<div>' + marker.placename + '</div><div id="pano"></div>');

                    var panoramaOptions = {
                        position: nearStreetViewLocation,
                        pov: {
                            heading: heading,
                            pitch: 30
                        }
                    };

                    var panorama = new google.maps.StreetViewPanorama(document.getElementById('pano'), panoramaOptions);
                }
                else {
                    infowindow.setContent('<div' + marker.placename + '</div>' + '<div>No street view found</div>');
                }
            };
        }
    };
    self.makeBounce = function (counter_marker) {
        counter_marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            counter_marker.setAnimation(null);
        }, 700);
    };

    self.addApiInfo = function (counter_marker) {
        $.ajax({
            url: "https://api.foursquare.com/v2/venues/" + counter_marker.venueId + '?client_id=X4HHID3RWFIUYVSC0RLOZYXQBUJ3S2XRKUEB4WK2ATAAHJ1O&client_secret=JSITBR05BB5YTBMTXTA5C1FJH2O2CZX4Q3HTLJ5TVP5AH4WC&v=20170625',
            dataType: "json",
            success: function (data) {
                var out = data.response.venue;
                counter_marker.likes = out.hasOwnProperty('likes') ? out.likes.summary : "Info not available";
                counter_marker.rating = out.hasOwnProperty('rating') ? out.rating : "Info not available";
                infowindow.setContent('<div>' + counter_marker.placename + '</div><p>' +
                    counter_marker.likes + '</p><p>Rating:' + counter_marker.rating + '</p><div id="pano"></div>');
                var streetViewService = new google.maps.StreetViewService();
                var radius = 50;
                streetViewService.getPanoramaByLocation(counter_marker.position, radius, self.getStreetView);
                infowindow.open(map, counter_marker);
            },
            error: function (e) {
                self.error("Foursquare data is invalid, Please Try Again!!");

            }
        });
    };


    for (var counter = 0; counter < self.no_places; counter++) {
        (function (counter_marker) {
            self.addApiInfo(counter_marker);
            counter_marker.addListener('click', function () {
                self.dMark(counter_marker);
            });
        })(self.selected_place()[counter]);
    }

    self.dMark = function (marker) {
        google.maps.event.trigger(marker, 'click');
    };

    self.display_full = function () {
        for (var counter = 0; counter < self.selected_place().length; counter++) {
            self.selected_place()[counter].setVisible(true);
            self.selected_place()[counter].show(true);
        }

    };

    self.display_refreshed = function (temp_input) {
        for (var counter = 0; counter < self.selected_place().length; counter++) {
            if (self.selected_place()[counter].placename.toLowerCase().indexOf(temp_input.toLowerCase()) > -1) {
                self.selected_place()[counter].show(true);
                self.selected_place()[counter].setVisible(true);
            }
            else {
                self.selected_place()[counter].show(false);
                self.selected_place()[counter].setVisible(false);

            }
        }
    };
    self.refresh_List = function () {
        var temp_input = self.place_input();
        infowindow.close();

        if (temp_input.length == 0) {
            self.display_full();
        }

        else {
            self.display_refreshed(temp_input);
        }
        infowindow.close();
    };






};
var map;
var infowindow;
function initMap() {
    map = new google.maps.Map(
        document.getElementById('map'), {
            center: { lat: 12.972442, lng: 77.580643 },
            zoom: 12,
            mapTypeControl: false
        });
    infowindow = new google.maps.InfoWindow();
    ko.applyBindings(new viewModel());
}
function errorHandling() {
    document.getElementById('map-error').innerHTML = "invalid map";
}















