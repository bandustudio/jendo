const mapbox = {
	accessToken : 'pk.eyJ1IjoibWFydGluZnJlZSIsImEiOiJ5ZFd0U19vIn0.Z7WBxuf0QKPrdzv2o6Mx6A',
	style: 'mapbox://styles/mapbox/basic-v8'
}

function createRandomString( length ) {
    var str = "";
    for ( ; str.length < length; str += Math.random().toString( 36 ).substr( 2 ) );
    return str.substr( 0, length );
}


function str2hex(string){
    var str = '';
    for(var i = 0; i < string.length; i++) {
        str += string[i].charCodeAt(0).toString(16);
    }
	if(str.length > 6 ){
		str = str.substr(str.length - 6);
	} else if(str.length < 6){
		str+= hexGenerator(str.length - 6);
	}
	return str;
}

function randomHex() {
	var hexNumbers = [0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F'];
	// picking a random item of the array
  	return hexNumbers[Math.floor(Math.random() * hexNumbers.length)];
}

// Genarates a Random Hex color
function hexGenerator(len) {
    hexValue = ['#'];
    for (var i = 0; i < len; i += 1) {
        hexValue.push(randomHex());
    }

    return hexValue.join('');
}

function scrollToBottom () {
	// Selectors
	var messages = jQuery('#messages');
	var newMessage = messages.children('li:last-child')
	// Heights
	var clientHeight = messages.prop('clientHeight');
	var scrollTop = messages.prop('scrollTop');
	var scrollHeight = messages.prop('scrollHeight');
	var newMessageHeight = newMessage.innerHeight();
	var lastMessageHeight = newMessage.prev().innerHeight();

	if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
		messages.scrollTop(scrollHeight);
	}
}

const Splash = {
	template: '#splash',
	mounted : function(){
		
	}
}

const Join = {
	template: '#join',
	mounted : function(){
		var room = this.$route.params.room || localStorage.getItem('room');
		var name = this.$route.params.name || localStorage.getItem('name');

		if(!room && !name){
			room = document.querySelector("html").getAttribute("room");
			var $room = prompt("Ingresa tu identificador de salón para ingresar",room);
		
			if ($room == null || $room.trim() == "") {
				alert("Debes ingresar un identificador válido")
			} else {

				var $name = prompt("Ingresa tu nombre","Usuario");

				if ($name == null || $name.trim() == "") {
					alert("Debes ingresar un nombre")
				} else {
					var chat = {
						room: $room,
						name: $name
					};
					localStorage.setItem("chat",JSON.stringify(chat));
					this.$router.push('/' + $room);
				}
			}
		} else {
			this.$router.push('/' + room);
		}
	}
}

const Chat = {
	template: '#chat',
	name:'chat',
	mounted : function(){
		var socket = io();
		var chat = JSON.parse(localStorage.getItem('chat'));
		if(!chat) chat = {room:createRandomString(6),name:createRandomString(6)};
		localStorage.setItem("chat",JSON.stringify(chat));
		var self = this;

		/* socket */

		socket.on('connect', function () {
		  var params = JSON.parse(localStorage.getItem('chat'))
		  socket.emit('join', params, function (err) {
		    if (err) {
		      alert(err);
		      window.location.href = '/';
		    } else {
		      console.log('No error');
		    }
		  });
		});

		socket.on('disconnect', function () {
		  console.log('Disconnected from server');
		});

		socket.on('updateUserList', function (users) {
		  var ul = jQuery('<ul></ul>');

		  users.forEach(function (user) {
		    ul.append(jQuery('<li></li>').text(user));
		  });

		  jQuery('#users').html(ul);
		});

		socket.on('newMessage', function (message) {
		  var formattedTime = moment(message.createdAt).format('h:mm a');
		  var template = jQuery('#message-template').html();
		  var html = Mustache.render(template, {
		    text: message.text,
		    from: message.from,
		    createdAt: formattedTime
		  });

		  jQuery('#messages').append(html);
		  scrollToBottom();
		});

		socket.on('newLocationMessage', function (message) {
		    if(!self.markers[message.from]){
		        var el = document.createElement('div');
		        var template = jQuery('#marker').html();
		        var color = self.colors[$('#users li').length-1];
				var html = Mustache.render(template, {
				    from: message.from,
				    color: color
				});		        
				el.innerHTML = html
		        self.markers[message.from] = new mapboxgl.Marker(el)
		    }

		    self.markers[message.from].setLngLat([message.longitude,message.latitude])
		    self.markers[message.from].addTo(self.map)
		    $(self.markers[message.from].getElement()).removeClass('pulse').addClass('pulse')

		    if(self.markers.length > 1){
			    var bounds = new mapboxgl.LngLatBounds();
			    bounds.extend([message.longitude,message.latitude]);
			    self.map.fitBounds(bounds, { padding: 50 });
			} else {
				self.map.setCenter([message.longitude,message.latitude]);
			}
		});

		/* map and geoloc */
		setTimeout(function(){
        	mapboxgl.accessToken = mapbox.accessToken
	        self.map = new mapboxgl.Map({
	            container: 'map',
	            center: [0,0],
	            style:mapbox.style,
	            zoom: 13
	        });

			self.initLayers();        
        },1);

        setTimeout(function(){
		  var template = jQuery('#share').html();
		  var html = Mustache.render(template, {
		    room: chat.room
		  });
		  jQuery('.chat').append(html);
        },5000);

	  	if (!navigator.geolocation) {
	    	alert('Geolocation not supported by your browser.');
	  	} else {

		  	navigator.geolocation.watchPosition(function(position){
			    socket.emit('createLocationMessage', {
			      	latitude: position.coords.latitude,
			      	longitude: position.coords.longitude
			    });

		  	}, function(e) {
		  		alert('Could not get coords.');
		  	}, {
	        	enableHighAccuracy: true,
	        	maximumAge: 5000 // 5 sec.
	      	});
		}

		/* click events */

		jQuery('#message-form').on('submit', function (e) {
		  e.preventDefault();

		  var messageTextbox = jQuery('[name=message]');

		  socket.emit('createMessage', {
		    text: messageTextbox.val()
		  }, function () {
		    messageTextbox.val('')
		  });
		});

		var locationButton = jQuery('#send-location');
		locationButton.on('click', function () {
		  	if (!navigator.geolocation) {
		    	return alert('Geolocation not supported by your browser.');
		  	}

		  	locationButton.attr('disabled', 'disabled').text('Sending location...');

		  	navigator.geolocation.getCurrentPosition(function (position) {
		    	locationButton.removeAttr('disabled').text('Send location');
			    socket.emit('createLocationMessage', {
			      	latitude: position.coords.latitude,
			      	longitude: position.coords.longitude
			    });
		  	}, function () {
		    	locationButton.removeAttr('disabled').text('Send location');
		    	alert('Unable to fetch location.');
		  	});
		});		
	},
	methods: {
		initLayers:function(){
			var styleList = document.getElementById('styles');
			styleList.onchange = this.switchLayer
			this.setStyle();
		},	
		setStyle:function(){
			var style = JSON.parse(localStorage.getItem("style"));
			if(style){
				var styleList = document.getElementById('styles');
				$(styleList).val(style.id);
		    	this.map.setStyle(style.url);
			}
		},
		switchLayer: function (layer) {
		    var style = {
		    	id:layer.target.value,
		    	url:'mapbox://styles/mapbox/' + layer.target.value + '-v9'
		    };
		    localStorage.setItem("style", JSON.stringify(style));
		    this.map.setStyle(style.url);
		}	
	},
	data: function() {
		return{
		  	map:null,
		  	markers:[],
		  	colors:["#fc0d1b","#46e166","#583470","#f313b5","#1369f3","#cdf313","#f39d13"]
		}
	}
}

const router = new VueRouter({
  mode: 'history',
  routes: [
    {path: '/', component: Splash, meta : { title: 'Jendo' }},
    {path: '/join/:room?/:name?', component: Join, meta : { title: 'Unete' }},
    {path: '/:room/:name?', component: Chat, meta : { title: 'Jendo' }}
   ]
});

router.afterEach(function (to, from, next) {
	var menuButton = document.querySelector('.menu-button');

	if(menuButton.classList.contains('cross')){
		menuSwiper.slideNext();
	}

	setTimeout(function(){
		const swiper = new Swiper('.swiper-container-v', {
			direction: 'vertical',
			slidesPerView: 1,
			spaceBetween: 0,
			mousewheel: true,
			pagination: {
				el: '.swiper-pagination',
				clickable: true,
			},
		});
	},0);	
});

var menuSwiper = null;

const app = new Vue({ 
	router: router,
	created: function(){
		setTimeout(function(){
			var menuButton = document.querySelector('.menu-button');
			menuSwiper = new Swiper('.swiper-container-m', {
			  slidesPerView: 'auto',
			  initialSlide: 1,
			  resistanceRatio: 0,
			  slideToClickedSlide: true,
			  on: {
			    init: function () {
			      var slider = this;
			      menuButton.addEventListener('click', function () {
			        //if (slider.activeIndex === 0) {
					if (slider.animating) {
			          slider.slideNext();
			        } else {
			          slider.slidePrev();
			        }
			      }, true);
			    },
			    slideChange: function () {
			      var slider = this;
			      if (slider.activeIndex === 0) {
			        menuButton.classList.add('cross');
			      } else {
			        menuButton.classList.remove('cross');
			      }
			    },
			  }
			});
		},0)		
	} 
}).$mount('#app');


$(document).on('click',"a:not([href*=':'])",function(event){

  const target = this;
  // handle only links that do not reference external resources
  if (target && target.href && !$(target).attr('bypass')) {
    // some sanity checks taken from vue-router:
    // https://github.com/vuejs/vue-router/blob/dev/src/components/link.js#L106
    const { altKey, ctrlKey, metaKey, shiftKey, button, defaultPrevented } = this;
    // don't handle with control keys
    if (metaKey || altKey || ctrlKey || shiftKey) return;
    // don't handle when preventDefault called
    if (defaultPrevented) return;
    // don't handle right clicks
    if (button !== undefined && button !== 0) return;
    // don't handle if `target="_blank"`

    if (target && target.getAttribute) {
      const linkTarget = target.getAttribute('target');
      if (/\b_blank\b/i.test(linkTarget)) return;
    }
    // don't handle same page links/anchors
    const url = new URL(target.href);
    const to = url.pathname;

    if (window.location.pathname !== to) {
      app.$router.push(to);
    }

    event.preventDefault();
  }  
});

Mustache.tags = ["[[", "]]"];