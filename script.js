const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models')
]).then(start)


async function start() {
  const container = document.createElement('div')
  container.style.position = 'relative'
  document.body.append(container)
  let image
  let canvas
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (image) image.remove()
    if (canvas) canvas.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    container.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    container.append(canvas)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks();
    faceapi.matchDimensions(canvas, image)
    const resizedDetections = faceapi.resizeResults(detections, image)
    resizedDetections.forEach((detection,i) => {
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      const headPos =getHatPos(resizedDetections);
      addHat(canvas,headPos[i]);
    })
  })
}

function getHatPos(face){
  function getHeadPos(nose,leftEye,rightEye){
    const headLeftX = leftEye[1].x-nose[3].x+leftEye[1].x
    const headLeftY = leftEye[1].y-nose[3].y+leftEye[1].y
    const headRightX = rightEye[2].x+rightEye[2].x-nose[3].x
    const headRightY = rightEye[2].y+rightEye[2].y-nose[3].y
    return [headLeftX,headLeftY, headRightX,headRightY];
  }
  return face.map(({landmarks}) => {
    const rightEye = landmarks.getRightEye();
    const leftEye = landmarks.getLeftEye();
    const nose = landmarks.getNose();
    return getHeadPos(nose,leftEye,rightEye);
  });

}

function addHat(canvas,headPos){
  const [headLeftX, headLeftY, headRightX, headRightY] = headPos
  const ctx = canvas.getContext("2d");

  const image = new Image()
  image.src = '../img/SantaHat.png'
  image.width=518
  image.height=420
  const scale = ((headRightX-headLeftX)/image.width)
  image.height=image.height*scale
  image.width=image.width*scale

  image.onload = () => {
    ctx.save();
    const angle = Math.atan((headRightY-headLeftY)/2.0/(headRightX-(headLeftX-headRightX)/2.0));
    const verTrans = image.height*Math.cos(angle)+image.width/3*Math.sin(angle)
    const horTrans = -image.width/3*Math.cos(angle)+image.height*Math.sin(angle)
    ctx.translate(headLeftX+horTrans, headLeftY-verTrans);

    ctx.rotate(angle);
    ctx.drawImage(image,0, 0,image.width*1.5,image.height*1.5);
    ctx.rotate(-angle);
    ctx.restore();
  };
}

