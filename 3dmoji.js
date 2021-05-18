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
				var camera_global = (-0.09983361, 0.5368214, -0.9119075)
				// camera_global = (0, 0, 0)

				const filler_left = new THREE.PointLight( 0xE1EFFF, 0.1, 13.65 );
				filler_left.position.set( -0.3 + camera_global[0], -0.35 + camera_global[1], 1.04 + camera_global[2] );
				filler_left.rotation.set(25.08, 154, 10.3);
				scene.add( filler_left );

				const filler_right = new THREE.PointLight( 0xE1EFFF, 0.1, 13.65 );
				filler_right.position.set( 0.78 + camera_global[0], -0.35 + camera_global[1], 1.04 + camera_global[2] );
				filler_right.rotation.set(25.08, 154, 10.3);
				scene.add( filler_right );

				const filler_up = new THREE.PointLight( 0xE1EFFF, 0.1, 13.65 );
				filler_up.position.set( 0.232 + camera_global[0], 0.3 + camera_global[1], 1.18 + camera_global[2] );
				filler_up.rotation.set(25.08, 154, 10.3);
				scene.add( filler_up );

				const key_center = new THREE.DirectionalLight( 0xffffff, 0.99 );
				key_center.position.set(0.194 + camera_global[0], -0.72 + camera_global[1], 3.251 + camera_global[2]);
				key_center.rotation.set(-0.04, -180, 39.5);
				scene.add( key_center );

				const light = new THREE.AmbientLight( 0xffffff ); // soft white light
				// scene.add( light );
			}

			function initHikeMojiModel() {

				const roughnessMipmapper = new RoughnessMipmapper( renderer );
				const loader = new FBXLoader();
				loader.load( 'models/fbx/Female_Anim_Vaibhav3.fbx', function ( object ) {

					hikemoji3d = object;
					hikemoji3d.position.set(0.14, -0.705, 0);
					hikemoji3d.scale.set(0.0053, 0.0053, 0.0053);
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

				} );
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