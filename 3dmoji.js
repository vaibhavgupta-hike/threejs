import * as THREE from 'https://threejs.org/build/three.module.js'
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js'
import { DragControls } from 'https://threejs.org/examples/jsm/controls/DragControls.js'
import { GLTFLoader } from 'https://threejs.org/examples/jsm/loaders/GLTFLoader.js'
import { RGBELoader } from 'https://threejs.org/examples/jsm/loaders/RGBELoader.js'
import { GUI } from 'https://threejs.org/examples/jsm/libs/dat.gui.module.js'


function getCubeLight(lightObject) {
	const geometry = new THREE.BoxBufferGeometry(.1, .1, .1)
	const material = new THREE.MeshBasicMaterial({
		color: 0xFF0000
	})
	const cube = new THREE.Mesh(geometry, material)
	adjustPositionOf1wrt2(cube, lightObject)
	return cube
}

const clock = new THREE.Clock()
clock.start()
const scene = new THREE.Scene()

const container = document.createElement( 'div' )
document.body.appendChild(container)

const pt_light1 = new THREE.PointLight( 0xFFFFFF, 1.0, 0.00, 1.00 )
pt_light1.position.set(-0.855, -0.1, 0.88)
scene.add(pt_light1)

const cubeHelper1 = getCubeLight(pt_light1)
scene.add(cubeHelper1)

const helper1 = new THREE.PointLightHelper( pt_light1, 0.5, 0xFF0000 )
scene.add(helper1)

const pt_light2 = new THREE.PointLight( 0xFFFFFF, 1.0, 0.00, 1.0 )
pt_light2.position.set(-0.094, 0.875, -0.195)
scene.add(pt_light2)

const helper2 = new THREE.PointLightHelper( pt_light2, 0.5, 0xFF0000 )
scene.add(helper2)

const cubeHelper2 = getCubeLight(pt_light2)
scene.add(cubeHelper2)

const pt_light3 = new THREE.PointLight( 0xFFFFFF, 1.0, 0.00, 1.0 )
pt_light3.position.set(-0.665, -0.467, -0.510)
scene.add(pt_light3)

const helper3 = new THREE.PointLightHelper( pt_light3, 0.5, 0xFF0000 )
scene.add(helper3)

const cubeHelper3 = getCubeLight(pt_light3)
scene.add(cubeHelper3)

console.log('pt_light1:', pt_light1)
console.log('pt_light2:', pt_light2)
console.log('pt_light3:', pt_light3)

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.01, 1000 )
camera.position.set(-0.72887, 0.0177, 2.89399)
camera.rotation.set(-0.001526, -0.23239, -0.00035)
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
		} )

	})
}

function configureMaterial(child) {

	child.material.opacity = 1.0
	if(!child.material.name.includes("specs") && !child.material.name.includes("eyebrow")) {
		child.material.alphaMode = THREE.OPAQUE
		child.material.transparent = false
		child.material.depthWrite = true

		child.material.metalness = Math.min(0.5, child.material.metalness)
	}
}

let hikemoji
function loadHikemoji() {
	return new Promise(async (resolve, reject) => {
		const loader = new GLTFLoader().setPath('models/gltf/Male_Pose2_out/')
		hikemoji = await loadFile('Male_Pose2.gltf', loader)

		hikemoji.scene.children[0].children[0].position.set(0, -1, 0)

		console.log('hikemoji:', hikemoji)
		hikemoji.scene.traverse((child) => {
				if (!child.isMesh) return
				var prevMaterial = child.material
				child.material = new THREE.MeshStandardMaterial()
				THREE.MeshBasicMaterial.prototype.copy.call(child.material, prevMaterial)

				configureMaterial(child)
				console.log(child.name, child)
		})

		scene.add( hikemoji.scene )
		resolve()
	})
}

await loadHikemoji()

const lodObject = hikemoji.scene.children[0].children[0]

const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
dirLight.target = lodObject
const posX = lodObject.position.x + (camera.position.x - lodObject.position.x) * 1.1
const posY = lodObject.position.y + (camera.position.y - lodObject.position.y) * 1.1
const posZ = lodObject.position.z + (camera.position.z - lodObject.position.z) * 1.1
dirLight.position.set(posX, posY, posZ)
scene.add(dirLight)

const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 5, '#FF0000')
scene.add(dirLightHelper)

// Add floor
const floorGeometry = new THREE.PlaneGeometry( 1000, 1000, 1, 1 )
const floorMaterial = new THREE.MeshPhongMaterial( {
	color: 0x807c70,
	reflectivity: 1.0,
 } )
const floor = new THREE.Mesh( floorGeometry, floorMaterial )
floor.material.side = THREE.DoubleSide
floor.rotation.x = 33
floor.position.y = -1
scene.add( floor )

const canvas = document.getElementById( 'canvas' )

const renderer = new THREE.WebGLRenderer( { canvas: canvas, alpha: true } )
renderer.setPixelRatio( window.devicePixelRatio )
renderer.setSize( window.innerWidth, window.innerHeight )
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1
renderer.outputEncoding = THREE.sRGBEncoding

container.appendChild(renderer.domElement)

function screenshot(fname, renderer) {
	return new Promise((resolve, reject) => {
		console.log('camera position', camera.position)
		console.log('camera rotation', camera.rotation)
		renderer.render(scene, camera)
		let base64String = renderer.domElement.toDataURL()
		let base64Image = base64String.split('base64,').pop()
			fs.writeFile(fname, base64Image, {encoding: 'base64'}, function(err) {
				console.log('File created')
				resolve()
		})
	})
}

var rgbeLoader = new RGBELoader().setDataType(THREE.UnsignedByteType).setPath('textures/equirectangular/')
const bgTexture = await loadFile('royal_esplanade_1k.hdr', rgbeLoader)

const pmremGenerator = new THREE.PMREMGenerator( renderer )
pmremGenerator.compileEquirectangularShader()
const envMap = pmremGenerator.fromEquirectangular( bgTexture ).texture

scene.background = null
scene.environment = null

bgTexture.dispose()
pmremGenerator.dispose()
console.log('background texture loaded in time', clock.getElapsedTime())

const orbitControls = new OrbitControls( camera, renderer.domElement )
orbitControls.minDistance = 2
orbitControls.maxDistance = 10
orbitControls.target.set( 0, 0, -0.2)
orbitControls.update()

const draggableObjects = [ cubeHelper1,
						   cubeHelper2,
						   cubeHelper3 ]
const dragControls = new DragControls( draggableObjects, camera, renderer.domElement )
dragControls.addEventListener( 'dragstart', function ( event ) {
	orbitControls.enabled = false
} )
dragControls.addEventListener( 'drag', function ( event ) {
	if(event.object === cubeHelper1) {
		adjustPositionOf1wrt2(pt_light1, cubeHelper1)
		adjustPositionOf1wrt2(helper1, cubeHelper1)
	}
	if(event.object === cubeHelper2) {
		adjustPositionOf1wrt2(pt_light2, cubeHelper2)
		adjustPositionOf1wrt2(helper2, cubeHelper2)
	}
	if(event.object === cubeHelper3) {
		adjustPositionOf1wrt2(pt_light3, cubeHelper3)
		adjustPositionOf1wrt2(helper3, cubeHelper3)
	}
} )
dragControls.addEventListener( 'dragend', function ( event ) {
	orbitControls.enabled = true
} )
dragControls.addEventListener( 'drag', function() {
	renderer.render(scene, camera)
} )


let numScreenshots = 0
var guiOptions = {
	capture: function() {
		numScreenshots += 1
		const fname = 'hikemoji_' + numScreenshots.toString() + '.png'
		renderer.render(scene, camera)
		captureScreenshot(renderer, fname)
	},
	background: function() {
		if(scene.background === null) {
			scene.background = envMap
			scene.environment = envMap
		} else {
			scene.background = null
			scene.environment = null
		}
	},
	light_controls: function() {
		const isOn = helper1.visible
		helper1.visible = !isOn
		helper2.visible = !isOn
		helper3.visible = !isOn
		cubeHelper1.visible = !isOn
		cubeHelper2.visible = !isOn
		cubeHelper3.visible = !isOn
		dirLightHelper.visible = !isOn
	},
	orbit_controls: function() {
		const isOn = orbitControls.enabled
		console.log('OrbitControls enabled:', isOn)
		orbitControls.enabled = !isOn
	}
}

var gui = new GUI()
gui.add(guiOptions, 'capture')
gui.add(guiOptions, 'background')
gui.add(guiOptions, 'light_controls')
gui.add(guiOptions, 'orbit_controls')

const PI = 3.14
const light1Folder = gui.addFolder('Light1')
light1Folder.add(pt_light1, 'intensity', 0 , 5, 0.01)
light1Folder.addColor({color: pt_light1.color}, 'color').onChange( function(colorValue){
	pt_light1.color.r = colorValue.r / 255.0
	pt_light1.color.g = colorValue.g / 255.0
	pt_light1.color.b = colorValue.b / 255.0
} )
const light2Folder = gui.addFolder('Light2')
light2Folder.add(pt_light2, 'intensity', 0 , 5, 0.01)
light2Folder.addColor({color: pt_light2.color}, 'color').onChange( function(colorValue){
	pt_light2.color.r = colorValue.r / 255.0
	pt_light2.color.g = colorValue.g / 255.0
	pt_light2.color.b = colorValue.b / 255.0
} )
const light3Folder = gui.addFolder('Light3')
light3Folder.add(pt_light3, 'intensity', 0 , 5, 0.01)
light3Folder.addColor({color: pt_light3.color}, 'color').onChange( function(colorValue){
	pt_light3.color.r = colorValue.r / 255.0
	pt_light3.color.g = colorValue.g / 255.0
	pt_light3.color.b = colorValue.b / 255.0
} )
hikemoji.scene.traverse((child) => {
	if(child.isMesh && child.material instanceof THREE.MeshStandardMaterial) {
		const materialFolder = gui.addFolder(child.name)
		materialFolder.add(child.material, 'metalness', 0, 1, 0.01)
		materialFolder.add(child.material, 'roughness', 0, 1, 0.01)
	}
})

function animate() {
	requestAnimationFrame(animate)
	renderer.render(scene, camera)
}
requestAnimationFrame(animate)

function captureScreenshot(renderer, fname) {
	const base64String = renderer.domElement.toDataURL()
	const base64Image = base64String.split(';base64,').pop()
    fs.writeFile(fname, base64Image, {encoding: 'base64'}, function(err) {
	  	console.log('File created')
	})
}

function adjustPositionOf1wrt2(obj1, obj2) {
	obj1.position.x = obj2.position.x
	obj1.position.y = obj2.position.y
	obj1.position.z = obj2.position.z
}
