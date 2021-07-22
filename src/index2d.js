import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';

import controlPanel from './controlPanel.html';

// Create renderer and control bar
const fullScreenRenderWindow = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});

const renderer = fullScreenRenderWindow.getRenderer();
const renderWindow = fullScreenRenderWindow.getRenderWindow();
fullScreenRenderWindow.getInteractor().setDesiredUpdateRate(15.0);
fullScreenRenderWindow.addController(controlPanel);

const imageActorI = vtkImageSlice.newInstance();
const imageActorJ = vtkImageSlice.newInstance();
const imageActorK = vtkImageSlice.newInstance();

renderer.addActor(imageActorK);
renderer.addActor(imageActorJ);
renderer.addActor(imageActorI);

function updateColorLevel(e) {
  const colorLevel = Number(
    (e ? e.target : document.querySelector('.colorLevel')).value
  );
  imageActorI.getProperty().setColorLevel(colorLevel);
  imageActorJ.getProperty().setColorLevel(colorLevel);
  imageActorK.getProperty().setColorLevel(colorLevel);
  renderWindow.render();
}

function updateColorWindow(e) {
  const colorLevel = Number(
    (e ? e.target : document.querySelector('.colorWindow')).value
  );
  imageActorI.getProperty().setColorWindow(colorLevel);
  imageActorJ.getProperty().setColorWindow(colorLevel);
  imageActorK.getProperty().setColorWindow(colorLevel);
  renderWindow.render();
}

// First call to render before the event listener
updateRender();

function updateRender() {

  const reader = vtkXMLImageDataReader.newInstance({ fetchGzip: true });
  reader
    .setUrl(`http://localhost:8081/jy_data/jy_data/4D FLOW/Amigo 1/Camcmorphv - 3983/triggerTime331.vti`, { loadData: true })
    .then(() => reader.loadData())
    .then(() => {
      const data = reader.getOutputData();
      const dataRange = data.getPointData().getScalars().getRange();
      const extent = data.getExtent();
      const imageMapperK = vtkImageMapper.newInstance();
      imageMapperK.setInputData(data);
      imageMapperK.setKSlice(30);
      imageActorK.setMapper(imageMapperK);
  
      const imageMapperJ = vtkImageMapper.newInstance();
      imageMapperJ.setInputData(data);
      imageMapperJ.setJSlice(30);
      imageActorJ.setMapper(imageMapperJ);
  
      const imageMapperI = vtkImageMapper.newInstance();
      imageMapperI.setInputData(data);
      imageMapperI.setISlice(30);
      imageActorI.setMapper(imageMapperI);
  
      renderer.resetCamera();
      renderer.resetCameraClippingRange();
      var t0 = performance.now();

      renderWindow.render();
      var t1 = performance.now();
      console.log("Call to render took " + (t1 - t0) + " milliseconds.");


      ['.sliceI', '.sliceJ', '.sliceK'].forEach((selector, idx) => {
        const el = document.querySelector(selector);
        el.setAttribute('min', extent[idx * 2 + 0]);
        el.setAttribute('max', extent[idx * 2 + 1]);
        el.setAttribute('value', 30);
      });
  
      ['.colorLevel', '.colorWindow'].forEach((selector) => {
        document.querySelector(selector).setAttribute('max', dataRange[1]);
        document.querySelector(selector).setAttribute('value', dataRange[1]);
      });
      document
        .querySelector('.colorLevel')
        .setAttribute('value', (dataRange[0] + dataRange[1]) / 2);
      updateColorLevel();
      updateColorWindow();  

    });
    document.querySelector('.sliceI').addEventListener('input', (e) => {
      imageActorI.getMapper().setISlice(Number(e.target.value));
      renderWindow.render();
    });
    
    document.querySelector('.sliceJ').addEventListener('input', (e) => {
      imageActorJ.getMapper().setJSlice(Number(e.target.value));
      renderWindow.render();
    });
    
    document.querySelector('.sliceK').addEventListener('input', (e) => {
      imageActorK.getMapper().setKSlice(Number(e.target.value));
      renderWindow.render();
    });
    
    document
      .querySelector('.colorLevel')
      .addEventListener('input', updateColorLevel);
    document
      .querySelector('.colorWindow')
      .addEventListener('input', updateColorWindow);
    
    global.fullScreen = fullScreenRenderWindow;
    global.imageActorI = imageActorI;
    global.imageActorJ = imageActorJ;
    global.imageActorK = imageActorK;
};


