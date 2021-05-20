import * as THREE from './three.module.js';
import { OrbitControls } from './OrbitControls.js';
import { GLTFLoader } from './GLTFLoader.js';
import { FBXLoader } from './FBXLoader.js'
import { RGBELoader } from './RGBELoader.js';
import { RoughnessMipmapper } from './RoughnessMipmapper.js';
import { GUI } from './dat.gui.module.js';


let camera, scene, renderer, hikemoji3d, mixer, container;
const clock = new THREE.Clock();


init();
animate();

function generateGIF( element, renderFunction, duration = 1, fps = 30 ) {
	const frames = Math.ceil(duration * fps);

	const canvas = document.createElement( 'canvas' );
	canvas.width = element.width;
	canvas.height = element.height;

	const context = canvas.getContext( '2d' );

	console.log('canvas.width:', canvas.width)
	console.log('canvas.height:', canvas.height)
	console.log('frames:', frames)
	const buffer = new Uint8Array( canvas.width * canvas.height * frames * 5 );
	const pixels = new Uint8Array( canvas.width * canvas.height );
	const writer = new GifWriter( buffer, canvas.width, canvas.height, { loop: 0 } );

	let current = 0;
	return new Promise( async function addFrame( resolve ) {
		renderFunction( current * fps );
		context.drawImage( element, 0, 0 );	// positioning image at (0, 0)
		const data = context.getImageData( 0, 0, canvas.width, canvas.height ).data;
		const palette = [];
		for ( var j = 0, k = 0, jl = data.length; j < jl; j += 4, k ++ ) {

			const r = Math.floor( data[ j + 0 ] * 0.05 ) * 20;
			const g = Math.floor( data[ j + 1 ] * 0.05 ) * 20;
			const b = Math.floor( data[ j + 2 ] * 0.05 ) * 20;
			const color = r << 16 | g << 8 | b << 0;
			
			const index = palette.indexOf( color );
			if ( index === -1 ) {
				pixels[ k ] = palette.length;
				palette.push( color );
			} else {
				pixels[ k ] = index;
			}
		}
		// Force palette to be power of 2
		let powof2 = 1;
		while ( powof2 < palette.length ) powof2 <<= 1;
		// powof2 = 256
		palette.length = powof2;

		const delay = 100 / fps; // Delay in hundredths of a sec (100 = 1s)
		const options = { palette: new Uint32Array( palette ), delay: delay };
		writer.addFrame( 0, 0, canvas.width, canvas.height, pixels, options );

		current ++;
		if ( current < frames ) {
			await setTimeout( addFrame, 0, resolve );
		} else {
			resolve( buffer.subarray( 0, writer.end() ) );
		}
	} );
}

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
	const loader = new GLTFLoader().setPath( 'models/gltf/Male_Anim_out/' );
	loader.load( 'Male_Anim.gltf', function ( gltf ) {

		hikemoji3d = gltf;
		hikemoji3d.scene.children[0].children[0].position.set(0.14, -0.705, 0);
		hikemoji3d.scene.children[0].children[0].scale.set(0.53, 0.53, 0.53);
		
		var moji_scene = gltf.scene;
		moji_scene.traverse((child) => {
		  if (! child.isMesh) return;
		  var prevMaterial = child.material;
		  child.material = new THREE.MeshPhongMaterial();
		  THREE.MeshStandardMaterial.prototype.copy.call( child.material, prevMaterial );
		  roughnessMipmapper.generateMipmaps( child.material );
		});
		// moji_scene.traverse(node => {
		// 	if(node.isMesh) {
		// 		console.log("traversing node ", node);
		// 		node.castShadow = false;
		// 		node.material.shininess=1000
		// 		node.material.metalness=1.5
		// 	}
		// });

		mixer = new THREE.AnimationMixer(moji_scene);

		var action = mixer.clipAction( gltf.animations[0] );
		action.setLoop(THREE.LoopOnce);
		action.clampWhenFinished = true;
		action.enable = true;
		action.play();

		console.log("gltf.animations: ", gltf.animations);

		scene.add( moji_scene );
		console.log('Hikemoji model loaded in', clock.getElapsedTime());
		render(0);
		console.log('Hikemoji model loaded in', clock.getElapsedTime());

		roughnessMipmapper.dispose();
		downloadGif()
	} );
}

async function downloadGif() {
	const buffer = await generateGIF(canvas, render, hikemoji3d.animations[0].duration, 10)
	console.log('Total time taken =', clock.getElapsedTime(), 'seconds')

	const blob = new Blob( [ buffer ], { type: 'image/gif' } );

	const link = document.createElement( 'a' );
	link.href = URL.createObjectURL( blob );
	link.download = 'animation.gif';
	link.dispatchEvent( new MouseEvent( 'click' ) );
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

function init() {

	container = document.createElement( 'div' );
	document.body.appendChild( container );

	initRenderer();
	const pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();

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
	initHikeMojiModel();
	initFloor();

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
	if(mixer) mixer.setTime(progress / 1000.0)
	renderer.render( scene, camera )
	// console.log("Ran in ", clock.getElapsedTime(), 'time')
}