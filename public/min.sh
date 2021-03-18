minify ./css/bulma.css ./css/styles.css ./css/graphik.css ./css/font-awesome.min.css ./css/swiper.min.css > ./css/bundle.min.css && 
minify ./js/vue.min.js ./js/vue-router.js ./js/vue-resource.min.js ./js/libs/swiper.min.js ./js/libs/jquery-3.1.0.min.js ./js/libs/moment.js ./js/libs/mustache.js ./js/routes.js ./js/pwa.js ./js/status.js > ./js/bundle.min.js && 
minify ./index_edit.html > ./views/index.html

