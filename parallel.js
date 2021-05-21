import * as THREE from './three.module.js'
import { RGBELoader } from './RGBELoader.js'
import { FBXLoader } from './FBXLoader.js'
import { OrbitControls } from './OrbitControls.js'


const scene = new THREE.Scene()

const container = document.createElement( 'div' );
document.body.appendChild(container);

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

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
camera.position.set( 0.1, 0.1, 1.88 );
camera.rotation.set( 0, -180, 0);
camera.fov = 47;

let hikemoji
async function loadHikemoji() {
	const loader = new FBXLoader().setPath('models/fbx/Female_Anim_Textures_4k/')
	await loader.load( 'Female_Anim_WithoutEmbed.fbx', function ( object ) {
		hikemoji = object
		hikemoji.position.set(0.14, -0.705, 0)
		hikemoji.scale.set(0.0053, 0.0053, 0.0053)

		console.log('fbx:', object)
		// Turn the controllers off
		hikemoji.children[0].children[0].visible = false

		// Incomplete. But these objects need to be used to load textures manually
		var female_lod = hikemoji.children[0].children[0].children[0]
		var basebody_geo = female_lod.children[0].children[0]
		const body_tex_loader = new THREE.TextureLoader();

		scene.add(hikemoji)
		console.log('Hikemoji loaded')
	} );
}
loadHikemoji()

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

sleep(1000).then(() => {

    const duration = hikemoji.animations[0].duration
	const fps = 30
	const numFrames = Math.floor(duration * fps)

	const numWorkers = 4
	const framesPerWorker = Math.ceil(numFrames / numWorkers)

	const arrayOfFrameArrays = new Array()
	for(var worker=0; worker<numWorkers; worker++) {
		const frameArray = new Array()
		for(var i=0; i<framesPerWorker; i++) {
			var frame = worker * framesPerWorker + i
			if(frame > numFrames) break
			frameArray.push(frame)
		}
		arrayOfFrameArrays.push(frameArray)
	}
	console.log('arrayOfFrameArrays:', arrayOfFrameArrays)

	const canvas1 = document.getElementById( 'canvas1' );
	const canvas2 = document.getElementById( 'canvas2' );
	const canvas3 = document.getElementById( 'canvas3' );
	const canvas4 = document.getElementById( 'canvas4' );

	getScreenshots(canvas1, arrayOfFrameArrays[0])
	getScreenshots(canvas2, arrayOfFrameArrays[1])
	getScreenshots(canvas4, arrayOfFrameArrays[3])
	getScreenshots(canvas3, arrayOfFrameArrays[2])

	function getScreenshots(canvas, frames) {
		const renderer = new THREE.WebGLRenderer( { canvas: canvas, alpha: true } );
		renderer.setPixelRatio( window.devicePixelRatio );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.toneMapping = THREE.ACESFilmicToneMapping;
		renderer.toneMappingExposure = 1;
		renderer.outputEncoding = THREE.sRGBEncoding;
		container.appendChild( renderer.domElement );

		function screenshot(fname, renderer) {
		renderer.render(scene, camera)
	    let base64String = renderer.domElement.toDataURL()
		let base64Image = base64String.split(';base64,').pop();
	    fs.writeFile(fname, base64Image, {encoding: 'base64'}, function(err) {
			    console.log('File created');
			});
		}

		new RGBELoader()
		.setDataType( THREE.UnsignedByteType )
		.setPath( 'textures/equirectangular/' )
		.load( 'royal_esplanade_1k.hdr', function ( texture ) {

			const pmremGenerator = new THREE.PMREMGenerator( renderer );
			pmremGenerator.compileEquirectangularShader();
			const envMap = pmremGenerator.fromEquirectangular( texture ).texture;

			scene.background = envMap;
			scene.environment = envMap;

			texture.dispose();
			pmremGenerator.dispose();
			console.log('background texture loaded')
		} );

		sleep(2000).then(() => {
			const mixer = new THREE.AnimationMixer(hikemoji);
			const action = mixer.clipAction(hikemoji.animations[0]);
			action.play();

			frames.forEach((frame) => {
				const timeFrame = frame * (1.0 / fps)
				mixer.setTime(timeFrame)
				const fname = 'images/frame_' + String(frame) + '.png'
				screenshot(fname, renderer)
			})
		})

		const controls = new OrbitControls( camera, renderer.domElement );
		controls.minDistance = 2;
		controls.maxDistance = 10;
		controls.target.set( 0, 0, -0.2);
		controls.update();
	}

	function renderHikemoji() {
		requestAnimationFrame(renderHikemoji)
		renderer.render(scene, camera)
	}
	// requestAnimationFrame(renderHikemoji)

});

	