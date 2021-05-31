import * as THREE from './three.module.js'
import { RGBELoader } from './RGBELoader.js'
import { FBXLoader } from './FBXLoader.js'
import { GLTFLoader } from './GLTFLoader.js'
import { OrbitControls } from './OrbitControls.js'




const clock = new THREE.Clock()
clock.start()
const scene = new THREE.Scene()

const container = document.createElement( 'div' )
document.body.appendChild(container)

const pt_light1 = new THREE.PointLight( 0xFFFFFF, 1.0, 0.00, 1.00 )
pt_light1.position.set(-0.855, 0.907, 0.88)
scene.add(pt_light1)

const pt_light2 = new THREE.PointLight( 0xFFFFFF, 1.0, 0.00, 1.0 )
pt_light2.position.set(-0.094, 1.875, -0.195)
scene.add(pt_light2)

const pt_light3 = new THREE.PointLight( 0xFFFFFF, 1.0, 0.00, 1.0 )
pt_light3.position.set(-0.665, 0.537, -0.510)
scene.add(pt_light3)

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 1000 );
camera.position.set(0.12103, 0.51828, 2.9341)
camera.rotation.set(-0.16388, 0.03808, 0.00629)
camera.fov = 50


function loadFile(path, loader) {
	return new Promise((resolve, reject) => {

		loader.load( path, function ( object ) {
			resolve(object)
		},
		(progress) => {
			console.log("progress:", progress)
		} ,
		(error) => {
			reject(error)
		} );

	})
}

function configureMaterial(child) {

	if(child.material.name.includes("Specs") || child.material.name.includes("Eyebrow")) {
		child.alphaMode = THREE.OPAQUE
		child.material.transparent = true
		child.material.depthWrite = false
	} else {
		child.alphaMode = THREE.OPAQUE
		child.material.transparent = false
		child.material.depthWrite = true
	}
}

let hikemoji
function loadHikemoji() {
	return new Promise(async (resolve, reject) => {
		const loader = new GLTFLoader().setPath('models/gltf/MaleLODA_Rig_V09_out/')
		hikemoji = await loadFile('MaleLODA_Rig_V09.gltf', loader)

		hikemoji.scene.children[0].children[0].position.set(0, -1, 0)

		console.log('hikemoji:', hikemoji)
		// Turn the controllers off
		// hikemoji.children[0].children[0].visible = false

		hikemoji.scene.traverse((child) => {
				if (!child.isMesh) return
				var prevMaterial = child.material
				// child.material = new THREE.MeshLambertMaterial()
				// // THREE.MeshBasicMaterial.prototype.copy.call(child.material, prevMaterial)
				// child.material.alpha = 0.8
				// // child.material.transparency = true
				// child.material.side = THREE.DoubleSides
				// child.material.depthWrite = false;
				// child.material.depthTest = false
				configureMaterial(child)
				
				console.log(child.name, child.alphaMode)
		});
		
		// Incomplete. But these objects need to be used to load textures manually
		const female_lod = hikemoji.scene.children[0].children[0]
		const texLoader = new THREE.TextureLoader().setPath('textures/Female_2K_1K_0.5K/1K/')
		
		// const basebody_geo = female_lod.children[0].children[0]
		// const body_diffuse_tex = await loadFile('Female_1K_body_Diffuse.png', texLoader)
		// basebody_geo.material.map = body_diffuse_tex
		
		// const body_normal_tex = await loadFile('Female_1K_body_Normal.png', texLoader)
		// basebody_geo.material.normalMap = body_normal_tex
		
		// const body_roughness_tex = await loadFile('Female_1K_body_Roughness.png', texLoader)
		// basebody_geo.material.specularMap = body_roughness_tex
		//
		//
		// const tongue_geo = female_lod.children[1].children[0].children[0]

		// hikemoji.scene.children[0].children[0].position.set(0, 0, 0);
		// hikemoji.scene.children[0].children[0].scale.set(0.53, 0.53, 0.53);

		// hikemoji.scene.traverse((child) => {
		//   if (! child.isMesh) return;
		//   var prevMaterial = child.material;
		//   child.material = new THREE.MeshPhongMaterial();
		//   THREE.MeshStandardMaterial.prototype.copy.call( child.material, prevMaterial );
		// });
		// moji_scene.traverse(node => {
		// 	if(node.isMesh) {
		// 		console.log("traversing node ", node);
		// 		node.castShadow = false;
		// 		node.material.shininess=1000
		// 		node.material.metalness=1.5
		// 	}
		// });
		//
		// mixer = new THREE.AnimationMixer(moji_scene);
		//
		// var action = mixer.clipAction( gltf.animations[0] );
		// action.setLoop(THREE.LoopOnce);
		// action.clampWhenFinished = true;
		// action.enable = true;
		// action.play();
		//
		// console.log("gltf.animations: ", gltf.animations);

		scene.add( hikemoji.scene );
		resolve()

		// camera.lookAt(hikemoji.scene.children[0].children[0].position)
	})
}

await loadHikemoji()

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

// const mixer = new THREE.AnimationMixer(hikemoji)
// const action = mixer.clipAction(hikemoji.animations[0])
// action.play()

function animate() {
	requestAnimationFrame(animate)
	// mixer.update(clock.getDelta())
	renderer.render(scene, camera)
	console.log('Camera Position, Rotation, FOV:', camera.position, camera.rotation, camera.fov)
}
requestAnimationFrame(animate)
