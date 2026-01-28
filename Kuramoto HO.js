let N  = 256;       // grid size
let K  = 3.;
let dt = 0.05;
let a  = 0.5;
let A  = Math.floor(1+a*2);


let theta, omega;
let offsets = [];
let exp_val = [];
let dtheta = new Float32Array(N*N);

function setup() {
  createCanvas(800, 800);
  colorMode(HSB, TWO_PI, 1, 1);
  noStroke();
  
  print(A)

  theta = new Float32Array(N*N);
  omega = new Float32Array(N*N);

  // initialize theta and omega
  for (let i=0;i<N;i++){
    for (let j=0;j<N;j++){
      let idx = i*N + j;
      theta[idx] = random(TWO_PI);
      omega[idx] = 1.+randomGaussian(0,0.3);
    }
  }

  // precompute neighbor offsets and exponential weights
  let s = 0
  for (let di=-A; di<=A; di++){
    for (let dj=-A; dj<=A; dj++){
      offsets.push([di,dj]);
      let f = Math.exp(-(di*di + dj*dj)/a)
      exp_val.push(f);
      s += f
    }
  }
  // Normalize to sum over neigh of K_ij = K
  for (let k=0;k<offsets.length;k++){
      exp_val[k] /= s
  }
}

function draw() {
  background(0);
  stepKuramoto();
  drawPhases();
}

function stepKuramoto() {

  // flattened loop
  for (let i=0;i<N;i++){
    for (let j=0;j<N;j++){
      const idx = i*N + j;
      const th = theta[idx];
      let sum = 0;

      for (let k=0;k<offsets.length;k++){
        const di = offsets[k][0];
        const dj = offsets[k][1];

        // periodic boundary using modulo
        const ii = (i - di + N) % N;
        const jj = (j - dj + N) % N;
        const nidx = ii*N + jj;

        sum += Math.sin(theta[nidx] - th) * exp_val[k];
      }

      dtheta[idx] = dt*(omega[idx] + K * sum);
    }
  }

  // update theta in-place
  for (let i=0;i<N*N;i++){
    theta[i] = (theta[i] + dtheta[i] + TWO_PI) % TWO_PI;
  }
}

function hsv2rgb(h, s, v){
  let r, g, b;
  let i = Math.floor(h*6);
  let f = h*6 - i;
  let p = v*(1 - s);
  let q = v*(1 - f*s);
  let t = v*(1 - (1-f)*s);
  i = i % 6;
  switch(i){
    case 0: r=v; g=t; b=p; break;
    case 1: r=q; g=v; b=p; break;
    case 2: r=p; g=v; b=t; break;
    case 3: r=p; g=q; b=v; break;
    case 4: r=t; g=p; b=v; break;
    case 5: r=v; g=p; b=q; break;
  }
  return [r,g,b];
}


function drawPhases(){
  loadPixels();
  let cellW = width / N;
  let cellH = height / N;

  let nor = 0 
  for (let k=0;k<offsets.length;k++){
    nor += exp_val[k]
  }
  
  for (let i=0;i<N;i++){
    for (let j=0;j<N;j++){
      const idx = i*N + j;
      let ave_phase = 0
      for (let k=0;k<offsets.length;k++){
        const di = offsets[k][0];
        const dj = offsets[k][1];

        // periodic boundary using modulo
        const ii = (i - di + N) % N;
        const jj = (j - dj + N) % N;
        const nidx = ii*N + jj;
        ave_phase += theta[nidx] * exp_val[k]
      }
        
      ave_phase /= nor
        
      const h = theta[idx]/TWO_PI; // normalize to 0..1
      const m = ave_phase/TWO_PI; // normalize to 0..1
      const d = 0.5+1*dtheta[idx]*4
      const v = (2*m-h+2)/4
      
      let c =0
      
      if ( i <  N/2 && j <  N/2 ){ c = h }
      if ( i <  N/2 && j >= N/2 ){ c = m }
      if ( i >= N/2 && j <  N/2 ){ c = d }
      if ( i >= N/2 && j >= N/2 ){ c = v }
      
      const rgb = hsv2rgb(c,1,1);

      const x0 = Math.floor(i*cellW);
      const y0 = Math.floor(j*cellH);

      for (let x=x0;x<x0+cellW;x++){
        for (let y=y0;y<y0+cellH;y++){
          const pix = 4*(y*width + x);
          pixels[pix] = rgb[0]*255;
          pixels[pix+1] = rgb[1]*255;
          pixels[pix+2] = rgb[2]*255;
          pixels[pix+3] = 255;
        }
      }
    }
  }

  updatePixels();
}
