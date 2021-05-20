import * as THREE from './three.module.js';

import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';
import { FBXLoader } from './FBXLoader.js'
import { RGBELoader } from './RGBELoader.js';
import { RoughnessMipmapper } from './RoughnessMipmapper.js';
import { GUI } from './dat.gui.module.js';


let camera, scene, renderer, hikemoji3d, mixer, container, capturer;
const clock = new THREE.Clock();


init();

capturer.start();
animate();

function initLights() {
	const filler_left = new THREE.PointLight( 0xE1EFFF, 0.1, 13.65 );
	filler_left.position.set(-0.3, -0.35, 1.04);
	scene.add( filler_left );

	const filler_right = new THREE.PointLight( 0xE1EFFF, 0.1, 13.65 );
	filler_right.position.set(0.78, -0.35, 1.04);
	scene.add( filler_right );

	const filler_up = new THREE.PointLight( 0xE1EFFF, 0.1, 13.65 );
	filler_up.position.set( 0.232, 0.3, 1.18);
	scene.add( filler_up );

	const key_center = new THREE.DirectionalLight( 0xffffff, 0.99 );
	key_center.position.set(0.194, -0.72, 3.251);
	key_center.rotation.set(-0.04, -180, 39.5);
	scene.add( key_center );
}

function initHikeMojiModel() {

	const roughnessMipmapper = new RoughnessMipmapper( renderer );
	
	const loader = new FBXLoader().setPath('models/fbx/Female_Anim_Textures_4k/')
	loader.load( 'Female_Anim_WithoutEmbed.fbx', function ( object ) {
		hikemoji3d = object
		hikemoji3d.position.set(0.14, -0.705, 0)
		hikemoji3d.scale.set(0.0053, 0.0053, 0.0053)

		console.log('fbx:', object)
		// Turn the controllers off
		hikemoji3d.children[0].children[0].visible = false

		var female_lod = hikemoji3d.children[0].children[0].children[0]
		console.log('female_lod:', female_lod)

		var basebody_geo = female_lod.children[0].children[0]
		console.log('basebody_geo:', basebody_geo)

		const body_tex_loader = new THREE.TextureLoader();
		body_tex_loader.load('')

		mixer = new THREE.AnimationMixer( object );
		const action = mixer.clipAction( object.animations[ 0 ] );
		action.play();
		object.traverse( function ( child ) {
			if ( child.isMesh ) {
				child.castShadow = true;
				child.receiveShadow = true;
			}
		} );
		scene.add( object );
		console.log('Hikemoji loaded in', clock.getElapsedTime(), 'seconds')
	} );

	// const loader = new GLTFLoader().setPath( 'models/gltf/MaleLODA_Rig_V02_Flip_out/' );
	// loader.load( 'MaleLODA_Rig_V02_Flip.gltf', function ( gltf ) {

	// 	hikemoji3d = gltf;
	// 	hikemoji3d.scene.children[0].children[0].position.set(0.14, -0.705, 0);
	// 	hikemoji3d.scene.children[0].children[0].scale.set(0.53, 0.53, 0.53);
		
	// 	var moji_scene = gltf.scene;
	// 	moji_scene.traverse((child) => {
	// 	  if (! child.isMesh) return;
	// 	  var prevMaterial = child.material;
	// 	  child.material = new THREE.MeshPhongMaterial();
	// 	  THREE.MeshStandardMaterial.prototype.copy.call( child.material, prevMaterial );
	// 	  roughnessMipmapper.generateMipmaps( child.material );
	// 	});
	// 	// moji_scene.traverse(node => {
	// 	// 	if(node.isMesh) {
	// 	// 		console.log("traversing node ", node);
	// 	// 		node.castShadow = false;
	// 	// 		node.material.shininess=1000
	// 	// 		node.material.metalness=1.5
	// 	// 	}
	// 	// });

	// 	mixer = new THREE.AnimationMixer(moji_scene);

	// 	var action = mixer.clipAction( gltf.animations[0] );
	// 	action.setLoop(THREE.LoopOnce);
	// 	action.clampWhenFinished = true;
	// 	action.enable = true;
	// 	action.play();

	// 	console.log("gltf.animations: ", gltf.animations);

	// 	scene.add( moji_scene );
	// 	console.log('Hikemoji model loaded in', clock.getElapsedTime());
	// 	render(0);
	// 	console.log('Hikemoji model loaded in', clock.getElapsedTime());

	// 	roughnessMipmapper.dispose();
	// 	downloadGif()
	// } );
}

function initRenderer() {
	renderer = new THREE.WebGLRenderer( { canvas: canvas, alpha: true } );
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1;
	renderer.outputEncoding = THREE.sRGBEncoding;
	container.appendChild( renderer.domElement );
}

function initCamera() {
	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
	camera.position.set( 0.1, 0.1, 1.88 );
	camera.rotation.set( 0, -180, 0);
	camera.fov = 47;
}

function initFloor() {
	const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
	mesh.rotation.x = - Math.PI / 2;
	scene.add( mesh );

	const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
	grid.material.opacity = 0.2;
	grid.position.y = -0.705;
	scene.add( grid );
}

function initCapturer() {
	capturer = new CCapture( { 
		format: 'webm',
		framerate: 60,
		verbose: true,
		timeLimit: 5,
		quality: 100
	} );
}

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	scene = new THREE.Scene();
	new RGBELoader()
		.setDataType( THREE.UnsignedByteType )
		.setPath( 'textures/equirectangular/' )
		.load( 'royal_esplanade_1k.hdr', function ( texture ) {

			const envMap = pmremGenerator.fromEquirectangular( texture ).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();
	} );

	const canvas = document.getElementById( 'canvas' );
	initRenderer();
	initCamera();
	initLights();
	initCapturer();
	initHikeMojiModel();
	initFloor();

	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();

	const controls = new OrbitControls( camera, renderer.domElement );
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.target.set( 0, 0, -0.2);
	controls.update();

	window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
	requestAnimationFrame(animate);

	const delta = clock.getDelta();
	render(delta);
	if(mixer) mixer.update(delta);
}

function render(progress) {
	// if(hikemoji3d) {
	// 	hikemoji3d.scene.rotation.y += progress;
	// }
	renderer.render( scene, camera );
	capturer.capture( canvas );
	// console.log("Ran in ", clock.getElapsedTime(), 'time')
}