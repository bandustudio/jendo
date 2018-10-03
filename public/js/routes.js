const mapbox = {
	accessToken : 'pk.eyJ1IjoibWFydGluZnJlZSIsImEiOiJ5ZFd0U19vIn0.Z7WBxuf0QKPrdzv2o6Mx6A',
	style: 'mapbox://styles/mapbox/basic-v8'
}

function getInitials(str){
	var initials = str.match(/\b\w/g) || [];
	return ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
}

function changename(){
	var store = JSON.parse(localStorage.getItem('chat')) || {room:document.querySelector("html").getAttribute("room"),name:randNick()};
	var $name = prompt("Ingresa tu nombre",store.name);

	if ($name == null || $name.trim() == "") {
		alert("Debes ingresar un nombre");
	} else {
		store.name = $name;
		localStorage.setItem("chat",JSON.stringify(store));
		location.href = location.href;
	}
}

function randNick() {
	const firsts = ['Nube','Cielo','Toro','La Vaca','Tigre','Zorro','Pájaro','Lago','Laguna'];
	const lasts = ['Verde','Azul','Amarillo','Blanco','Violeta','Alegre','Alejado','Fortuito','Ruidoso','Veloz','Bravo','Sentado','Corriendo'];
	var first = firsts[Math.floor(Math.random()*firsts.length)];
	var last = lasts[Math.floor(Math.random()*lasts.length)];
	return `${first} ${last}`;
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

	var objDiv = $(".chat__messages");
	var h = objDiv.get(0).scrollHeight;
	objDiv.animate({scrollTop: h});
}

const Splash = {
	template: '#splash',
	mounted : function(){
		
	}
}

const Terms = {
	template: '#terms',
	mounted : function(){
		
	}
}

const Security = {
	template: '#security',
	mounted : function(){
		
	}
}

const Contact = {
	template: '#contact',
	mounted : function(){
		
	}
}

const Chat = {
	template: '#chat',
	name:'chat',
	mounted : function(){

		if(!this.$route.params.room){
			alert("Debes ingresar al menos una identifición de conversación");
			app.$router.push(document.querySelector("html").getAttribute("room"));
			return;
		}
		
		var chat = JSON.parse(localStorage.getItem('chat')) || {room:null,name:null};
		var room = this.$route.params.room;
		var name = this.$route.params.name || chat.name;
		var self = this;

		this.socket = io();

		/* verify chat data */
		if(!name) {
			var $name = prompt("Ingresa tu nombre",randNick());
			if ($name == null || $name.trim() == "") {
				alert("Debes ingresar un nombre");
				return app.$router.push('/');
			} else {
				name = $name;
			}
		}

		/* store chat data */
		this.name = name;
		this.room = room;
		const store = {room:room,name:name};
		localStorage.setItem("chat",JSON.stringify(store));

		/* socket */

		this.socket.on('connect', function () {
		  	self.socket.emit('join', store, function (err) {
			    if (err) {
			      	alert(err);
			      	window.location.href = '/';
			    } else {
			      	console.log('No error');
		    	}
		  	});
		});

		this.socket.on('disconnect', function () {
		  	console.log('Disconnected from server');
		});

		this.socket.on('updateUserList', function (users) {
			var ul = jQuery('<ul></ul>');

			users.forEach(function (user,i) {
				const color = self.colors[i];

				ul.append(jQuery('<li></li>')
					.attr('color',color)
					.attr('from',user)
					.text(user)
					.css('color',color));
			});

			jQuery('#users').html(ul);
		});

		this.socket.on('newMessage', function (message) {
			var formattedTime = moment(message.createdAt).format('HH:mm');
			var template = jQuery('#message-template').html();
			var html = Mustache.render(template, {
				text: message.text,
				from:  (message.from === self.name ? null:message.from),
				cls: (message.from === self.name ? 'me':''),
				createdAt: formattedTime
			});

			jQuery('#messages').append(html);
			scrollToBottom();
		});

		this.socket.on('newLocationMessage', function (message) {

			var connected = Object.keys(self.markers).length;

		    if(!self.markers[message.from]){
		        var el = document.createElement('div');
		        var template = jQuery('#marker').html();
		        var color = $('#users li[from="'+message.from+'"]').attr('color');
				var initials = message.from.match(/\b\w/g) || [];
				var html = Mustache.render(template, {
				    initials: getInitials(message.from),
				    from: message.from,
				    color: color
				});		        
				el.innerHTML = html;
		        self.markers[message.from] = new mapboxgl.Marker(el);
		    }

		    self.markers[message.from].setLngLat([message.longitude,message.latitude])
		    self.markers[message.from].addTo(self.map)
		    $(self.markers[message.from].getElement()).removeClass('pulse').addClass('pulse')

		    if(connected != Object.keys(self.markers).length){
			    if(Object.keys(self.markers).length > 1){
				    var bounds = new mapboxgl.LngLatBounds();
				    for(var i in self.markers){
				    	var p = self.markers[i].getLngLat();
				    	bounds.extend([p.lng,p.lat]);	
				    }				    
				    self.map.fitBounds(bounds, { padding: 100 });
				} else {
					self.map.setCenter([message.longitude,message.latitude]);
				}
			}
		});

		/* map and geoloc */
		setTimeout(function(){
        	mapboxgl.accessToken = mapbox.accessToken
	        self.map = new mapboxgl.Map({
	            container: 'map',
	            center: [0,0],
	            style:mapbox.style,
	            zoom: 14
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
			    self.socket.emit('createLocationMessage', {
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
	},
	methods: {
		sendMessage:function({type,target}){
			var messageTextbox = $('input[name="message"]');
			if(messageTextbox.val().trim()==''){
				$('.chat__messages').toggle();
			} else {
				if($('.chat__messages').is(':hidden')){
					$('.chat__messages').toggle();
				}
				this.socket.emit('createMessage', {
					text: messageTextbox.val()
				}, function () {
					messageTextbox.val('')
				});
			}
		},
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
			socket:null,
		  	map:null,
		  	name:null,
		  	room:null,
		  	markers:[],
		  	colors:["#fc0d1b","#46e166","#583470","#f313b5","#1369f3","#cdf313","#f39d13"]
		}
	}
}

const router = new VueRouter({
  mode: 'history',
  routes: [
    {path: '/', component: Splash, meta : { title: 'Jendo' }},
    {path: '/terms', component: Terms, meta : { title: 'Términos y condiciones' }},
    {path: '/security', component: Security, meta : { title: 'Seguridad' }},
    {path: '/contact', component: Contact, meta : { title: 'Contacto' }},
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

		// status
		var store = JSON.parse(localStorage.getItem('chat'));

		if(store && store.name){
			$('.menu ul').append("<li><a href='#' class='has-text-success' onclick='changename()'>"+store.name+"</a></li>")
		}		          

		// menu swiper
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
		},0);
		$('.hidden-loading').removeClass('hidden-loading');
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