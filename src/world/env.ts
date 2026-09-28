import * as THREE from 'three';

/**
 * What the metal reflects. Brass only reads as brass when it has something to
 * mirror, so the machines sit in a dark room with one warm skylight above
 * (the light of the floors still to come), a cool slit behind and a faint
 * floor bounce. Built once into a PMREM and used as scene.environment.
 */
export function makeEnvironment(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene();
  const disposables: { dispose(): void }[] = [];

  const shell = new THREE.SphereGeometry(20, 32, 16);
  const shellMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.006, 0.0055, 0.005), side: THREE.BackSide });
  room.add(new THREE.Mesh(shell, shellMat));
  disposables.push(shell, shellMat);

  const panel = (color: THREE.Color, w: number, h: number, pos: [number, number, number], look = new THREE.Vector3()) => {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...pos);
    mesh.lookAt(look);
    room.add(mesh);
    disposables.push(g, m);
  };

  // warm skylight: a long strip overhead, slightly forward
  panel(new THREE.Color(9.0, 6.6, 4.2), 16, 3.2, [0, 14, 3]);
  // a second, dimmer strip so wheel rims catch a double highlight
  panel(new THREE.Color(3.2, 2.3, 1.5), 10, 1.2, [4, 11, -6]);
  // cool slit behind and to the left: rim light on edges
  panel(new THREE.Color(0.9, 1.5, 1.9), 2.2, 14, [-13, 3, -8]);
  // faint warm bounce from below
  panel(new THREE.Color(0.28, 0.2, 0.13), 26, 26, [0, -14, 0]);
  // a soft front fill so faces towards the camera aren't pure black
  panel(new THREE.Color(0.5, 0.42, 0.34), 12, 6, [2, 2, 16]);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const rt = pmrem.fromScene(room, 0.035);
  pmrem.dispose();
  disposables.forEach((d) => d.dispose());
  return rt;
}
