console.warn = function() {};

window.onload = function() {
    var container, stats;
    var camera, scene, renderer, orbitControls;

    var dLight;

    var mouseX = 0;
    var mouseY = 0;

    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;

    var clock = new THREE.Clock();

    var FILE_TYPE = {
        OBJ: "obj",
        FBX: "fbx",
        GLTF: "gltf"
    }

    var type = FILE_TYPE.OBJ;
    var selectModel;
    var mixer;

    var XXX;


    init();
    animate();

    function fitWindow(model) {
        var s = new THREE.Box3().setFromObject(model);

        var max = Math.max(s.max.x, s.max.y, s.max.z);

        model.position.set(0, 0, 0);
        model.scale.set(1 / max, 1 / max, 1 / max);

        camera.position.z = 5;
        camera.position.y = 5;

        camera.lookAt(model);
        camera.updateProjectionMatrix();
    }


    function gltfParse() {
        var sceneInfo = {
            name: "Duck2",
            url: "http://tmx.taobao.net/model-viewer/models/BrainStem/glTF/BrainStem.gltf",
            // url: "//ossgw.alicdn.com/tmall-c3/tmx/5c74fd4f986785bdda738204004922ec.gltf",

            cameraPos: new THREE.Vector3(0, 3, 5),
            addLights: true,
            addGround: true,
            shadows: true
        }

        function addlight(mm) {
            if (sceneInfo.addLights) {
                scene.remove(dLight);

                var ambient = new THREE.AmbientLight(0x222222);
                scene.add(ambient);

                var directionalLight = new THREE.DirectionalLight(0xdddddd);
                directionalLight.position.set(0, 0, 1).normalize();
                scene.add(directionalLight);

                var spot = new THREE.SpotLight(0xffffff, 1);
                spot.position.set(camera.position);
                spot.scale.set(10, 10, 10);
                spot.angle = 0.25;
                spot.distance = 1024;
                spot.penumbra = 0.75;

                if (sceneInfo.shadows) {
                    spot.castShadow = true;
                    spot.shadow.bias = 0.0001;
                    spot.shadow.mapSize.width = 2048;
                    spot.shadow.mapSize.height = 2048;
                }

                fitWindow(spot);
                scene.add(spot);
            }

            if (sceneInfo.shadows) {
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
        }

        function addGround() {
            if (sceneInfo.addGround) {
                var groundMaterial = new THREE.MeshPhongMaterial({
                    color: 0xFF0000,
                    shading: THREE.SmoothShading
                });
                ground = new THREE.Mesh(new THREE.PlaneBufferGeometry(512, 512), groundMaterial);

                if (sceneInfo.shadows) {
                    ground.receiveShadow = true;
                }

                if (sceneInfo.groundPos) {
                    ground.position.copy(sceneInfo.groundPos);
                } else {
                    ground.position.z = -70;
                }

                ground.rotation.x = -Math.PI / 2;

                scene.add(ground);
            }
        }

        function gltfParser(gltf) {
            var _object = gltf.scene;
            var _animations = gltf.animations;
            var _camera = gltf.cameras;

            XXX = _object;
            XXX.name = selectModel.id;

            if (sceneInfo.cameraPos)
                camera.position.copy(sceneInfo.cameraPos);

            if (sceneInfo.center) {
                orbitControls.target.copy(sceneInfo.center);
            }

            if (sceneInfo.objectPosition) {
                _object.position.copy(sceneInfo.objectPosition);
            }

            if (sceneInfo.objectRotation)
                _object.rotation.copy(sceneInfo.objectRotation);

            if (sceneInfo.objectScale)
                _object.scale.copy(sceneInfo.objectScale);


            if (_animations && _animations.length) {
                mixer = new THREE.AnimationMixer(_object);

                for (var i = 0; i < _animations.length; i++) {
                    var animation = _animations[i];

                    mixer.clipAction(animation).play();
                }
            }

            //gltf 提供的以场景为单位.
            fitWindow(_object);
            addlight(_object);

            scene.add(_object);
            $(".m-segment").hide();

            $("#loading").text("All loaded");
        }

        var loader = new THREE.GLTFLoader;
        loader.setCrossOrigin('Anonymous');
        loader.load(selectModel.gltfurl, function(gltf) {
            gltfParser(gltf);
        });
    }

    function fileRoute(name) {
        var ss = name || "earth";

        _models.forEach(function(m) {
            console.log(_models)
            if (ss == m.id) {
                selectModel = m;

                if (selectModel.type == "gltf") {
                    type = FILE_TYPE.GLTF;
                    gltfParse();
                }
            }
        })
    }

    fileRoute();

    $("#urlTxt").on("change", function(e) {
        var xx_name = "xx" + Date.now();
        var xx_url = $(this).val();
        _models.push({
            "id": xx_name,
            "type": "gltf",
            "gltfurl": xx_url
        });

        mixer = null;

        if (!!XXX) {
            scene.remove(scene.getObjectByName(XXX.name));
        }

        $("#loading").text("loading....");
        fileRoute(xx_name);
    })

    function init() {
        container = document.getElementById('c');
        document.body.appendChild(container);

        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
        camera.name = "camera"


        // scene
        window.scene = scene = new THREE.Scene();

        var ambient = new THREE.AmbientLight(0xffffff);
        ambient.position.set(0, 100, 0);
        ambient.intensity = 1;
        scene.add(ambient);

        renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true
        });

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xCCCCCC);
        container.appendChild(renderer.domElement);

        orbitControls = new THREE.OrbitControls(camera, renderer.domElement);
    }

    function onWindowResize() {
        windowHalfX = window.innerWidth / 2;
        windowHalfY = window.innerHeight / 2;

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onDocumentMouseMove(event) {
        mouseX = (event.clientX - windowHalfX) / 2;
        mouseY = (event.clientY - windowHalfY) / 2;
    }

    function animate() {
        orbitControls && orbitControls.update();
        render();

        if (selectModel && selectModel.type == FILE_TYPE.GLTF) {
            if (mixer) mixer.update(clock.getDelta());
            THREE.GLTFLoader.Shaders.update(scene, camera);
        }

        requestAnimationFrame(animate);
    }

    function render() {
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
    }
}