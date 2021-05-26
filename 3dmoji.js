import * as THREE from './three.module.js'
import { RGBELoader } from './RGBELoader.js'
import { FBXLoader } from './FBXLoader.js'
import { OrbitControls } from './OrbitControls.js'




const clock = new THREE.Clock()
clock.start()
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
camera.position.set(0.1,  0.09999999999999995,1.8800000000000001)
camera.rotation.set(-0.048039932847762506, 0.04798459447086554, 0.0023060623704482023)
camera.fov = 47;


function loadFile(path, loader) {
	return new Promise((resolve, reject) => {

		loader.load( path, function ( object ) {
			resolve(object)
		},
		undefined,
		(error) => {
			reject(error)
		} );

	})
}

let hikemoji
function loadHikemoji() {
	return new Promise(async (resolve, reject) => {
		const loader = new FBXLoader().setPath('models/fbx/Female_Anim_Textures_4k/')
		hikemoji = await loadFile('Female_Anim_WithoutEmbed.fbx', loader)

		hikemoji.position.set(0.14, -0.705, 0)
		hikemoji.scale.set(0.0053, 0.0053, 0.0053)

		console.log('hikemoji:', hikemoji)
		// Turn the controllers off
		hikemoji.children[0].children[0].visible = false

		// Incomplete. But these objects need to be used to load textures manually
		var female_lod = hikemoji.children[0].children[0].children[0]
		var basebody_geo = female_lod.children[0].children[0]

		const texLoader = new THREE.TextureLoader().setPath('textures/Female_2K_1K_0.5K/1K/')
		const body_diffuse_tex = await loadFile('Female_1K_body_Diffuse.png', texLoader)
		basebody_geo.map = body_diffuse_tex

		const body_normal_tex = await loadFile('Female_1K_body_Normal.png', texLoader)
		basebody_geo.normalMap = body_normal_tex


		scene.add(hikemoji)
		console.log('Hikemoji loaded')
		resolve()
	})
}

await loadHikemoji()

const duration = hikemoji.animations[0].duration
const fps = 30
const numFrames = Math.floor(duration * fps)

const numWorkers = 4
const framesPerWorker = Math.ceil(numFrames / numWorkers)

const canvas = document.getElementById( 'canvas' );

const renderer = new THREE.WebGLRenderer( { canvas: canvas, alpha: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;
container.appendChild(renderer.domElement);

function screenshot(fname, renderer) {
	return new Promise((resolve, reject) => {
		console.log('camera position', camera.position)
		console.log('camera rotation', camera.rotation)
		renderer.render(scene, camera)
		let base64String = renderer.domElement.toDataURL()
		let base64Image = base64String.split(';base64,').pop();
			fs.writeFile(fname, base64Image, {encoding: 'base64'}, function(err) {
				console.log('File created');
				resolve()
		});
	})
}

var rgbeLoader = new RGBELoader().setDataType(THREE.UnsignedByteType).setPath('textures/equirectangular/')
const bgTexture = await loadFile('royal_esplanade_1k.hdr', rgbeLoader)

const pmremGenerator = new THREE.PMREMGenerator( renderer );
pmremGenerator.compileEquirectangularShader();
const envMap = pmremGenerator.fromEquirectangular( bgTexture ).texture;

scene.background = envMap;
scene.environment = envMap;

bgTexture.dispose();
pmremGenerator.dispose();
console.log('background texture loaded in time', clock.getElapsedTime())

const controls = new OrbitControls( camera, renderer.domElement )
controls.minDistance = 2
controls.maxDistance = 10
controls.target.set( 0, 0, -0.2)
controls.update()

const mixer = new THREE.AnimationMixer(hikemoji)
const action = mixer.clipAction(hikemoji.animations[0])
action.play()

function animate() {
	requestAnimationFrame(animate)
	mixer.update(clock.getDelta())
	renderer.render(scene, camera)
}
requestAnimationFrame(animate)
