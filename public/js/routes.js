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

const Hub = {
	template: '#hub',
	mounted : function(){
		console.log(this.$route.params.room)
		var room = this.$route.params.room || localStorage.getItem('room') || document.querySelector("html").getAttribute("room");
		var displayName = this.$route.params.displayName || localStorage.getItem('displayName');
		var $room = prompt("Ingresa tu identificador de salón para ingresar",room);
		
		if ($room == null || $room.trim() == "") {
			alert("Debes ingresar un identificador válido")
		} else {

			var $displayName = prompt("Ingresa tu nombre","Usuario");

			if ($displayName == null || $displayName.trim() == "") {
				alert("Debes ingresar un nombre")
			} else {
				var chat = {
					room: $room,
					displayName: $displayName
				};
				localStorage.setItem("chat",JSON.stringify(chat));
				this.$router.push('/' + $room);
			}
		}
	}
}

const Chat = {
	template: '#chat',
	mounted : function(){
		var socket = io();

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
		  var ol = jQuery('<ol></ol>');

		  users.forEach(function (user) {
		    ol.append(jQuery('<li></li>').text(user));
		  });

		  jQuery('#users').html(ol);
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
		  var formattedTime = moment(message.createdAt).format('h:mm a');
		  var template = jQuery('#location-message-template').html();
		  var html = Mustache.render(template, {
		    from: message.from,
		    url: message.url,
		    createdAt: formattedTime
		  });

		  jQuery('#messages').append(html);
		  scrollToBottom();
		});

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
	}
}

const router = new VueRouter({
  mode: 'history',
  routes: [
    {path: '/', component: Splash, meta : { title: 'Jendo1' }},
    {path: '/hub/:uuid?/:displayName?', component: Hub, meta : { title: 'Hub' }},
    {path: '/:uuid', component: Chat, meta : { title: 'Chat' }}
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