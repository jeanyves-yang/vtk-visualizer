import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';


// Set up actor and mapper
const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();

const container = document.querySelector('#container');

container.style.position = 'relative';

// Create renderer and control bar
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
  container,
  containerStyle: {height:'100%'},
});

const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
renderWindow.getInteractor().setDesiredUpdateRate(15.0);

// Controller ID of the volume to display
let volumeId = 0;

// First call to render before the event listener
updateRender();

// Event listener on any key pressed, will go to the next volume
document.addEventListener('keydown', updateRender);

function updateRender() {
renderer.removeAllActors();

console.log("volumeId: ", volumeId);

// Set up LUT, opacity
const lookupTable = vtkColorTransferFunction.newInstance();
const piecewiseFun = vtkPiecewiseFunction.newInstance();

// set up simple linear opacity function
// This assumes a data range of 0 -> 256
for (let i = 0; i <= 8; i++) {
    piecewiseFun.addPoint(i * 16, i / 8);
}

// Actor properties
actor.getProperty().setScalarOpacity(0, piecewiseFun);
actor.getProperty().setRGBTransferFunction(0, lookupTable);

// set up color transfer function
lookupTable.applyColorMap(vtkColorMaps.getPresetByName('Cool to Warm'));
lookupTable.setMappingRange(0, 256);

const reader = vtkXMLImageDataReader.newInstance({ fetchGzip: true });
const readerMagnitude = vtkXMLImageDataReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`http://192.168.0.16/4DFlow_testData/4D_anatomic/0${volumeId}.vti`, { loadData: true })
  .then(() => reader.loadData())
  .then(() => {
    readerMagnitude
    .setUrl(`http://192.168.0.16/4DFlow_testData/4D_magnitude/${volumeId}.vti`, { loadData: true })
    .then(() => readerMagnitude.loadData())
    .then(() => { 
    // Map input read from vti files
    mapper.setInputConnection(readerMagnitude.getOutputPort());
    const ctfun = vtkColorTransferFunction.newInstance();
    //const range2 = readerMagnitude.getOutputData().getPointData().getScalars().getRange();
        //console.log(range2);

    //reader.getOutputData().getPointData().setActiveScalars(readerMagnitude.getOutputData().getPointData().getScalars());
    //const range = readerMagnitude.getOutputData().getPointData().getScalars().getRange();
    //lookupTable.setMappingRange(...readerMagnitude.getOutputData().getPointData().getScalars().getRange());

    const dimensions = reader.getOutputData().getDimensions();
    const typedArray = readerMagnitude.getOutputData().getPointData().getScalars().getData();
    const origTypedArray = reader.getOutputData().getPointData().getScalars().getData();
    let min = 10000;
    let max = 0;
    let newArray =  new Float32Array(dimensions);


    for (let x = 0; x < dimensions[0]; x++) {
      for (let y = 0; y < dimensions[1]; y++) {
        for (let z = 0; z < dimensions[2]; z++) {
          const idx = (x + y * dimensions[0] + z * dimensions[0] * dimensions[1]);

          // Associate to the pixel value in the anatomical data a color based on the flux magnitude (more red -> higher magnitude)
          //ctfun.addRGBPoint(origTypedArray[idx], typedArray[idx]*255, 0.0, 0.0);
          newArray[idx] = (origTypedArray[idx] + typedArray[idx]) /2;

          if(origTypedArray[idx] > max) {
            max = origTypedArray[idx];
          }
          if(origTypedArray[idx] < min) {
            min = origTypedArray[idx];
          }
        }
      }
    }
    const dataArray = vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: newArray,
    });
    dataArray.setName('scalars');
    reader.getOutputData().getPointData().setScalars(dataArray);
    console.log("min: ", min);
    console.log("max: ", max);

    //actor.getProperty().setRGBTransferFunction(0, ctfun);
    

    // Update LUT based on input range
    const range = reader.getOutputData().getPointData().getScalars().getRange();
    lookupTable.setMappingRange(...reader.getOutputData().getPointData().getScalars().getRange());
    lookupTable.updateRange();

    const sampleDistance =
        0.7 *
        Math.sqrt(
        reader.getOutputData(0)
            .getSpacing()
            .map((v) => v * v)
            .reduce((a, b) => a + b, 0)
        );
    mapper.setSampleDistance(sampleDistance);

    // Tell the actor which mapper to use
    actor.setMapper(mapper);

    // Customize rendering params of the actor
    actor.getProperty().setGradientOpacityMinimumValue(0, 0);
    actor.getProperty().setInterpolationTypeToLinear();

    actor
      .getProperty()
      .setGradientOpacityMaximumValue(0, (range[1] - range[0]) * 0.05);

    // - Use shading based on gradient
    actor.getProperty().setShade(true);
    actor.getProperty().setUseGradientOpacity(0, true);
    
    // - generic good default
    actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
    actor.getProperty().setGradientOpacityMaximumOpacity(0, 256.0);
    actor.getProperty().setAmbient(0.2);
    actor.getProperty().setDiffuse(0.7);
    actor.getProperty().setSpecular(0.3);
    actor.getProperty().setSpecularPower(8.0);

    renderer.addVolume(actor);

    // Reset camera and render the scene
    renderer.resetCamera();
    renderWindow.render();

    // Increment the volume id
    if(volumeId < 50)
    {
        volumeId = volumeId + 1;
    }
    else
    {
        volumeId = 0;
    }
  });

  });
};


/*const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
    container,
    containerStyle: {height: '100%'},
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();*/

