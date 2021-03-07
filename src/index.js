import vtkGenericRenderWindow from 'vtk.js/Sources/Rendering/Misc/GenericRenderWindow';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import vtkXMLImageDataReader from 'vtk.js/Sources/IO/XML/XMLImageDataReader';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkColorMaps from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/ColorMaps';

// Set up actor and mapper
const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();

const container = document.querySelector('#container');

// Create renderer
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [0, 0, 0],
    container,
    containerStyle: {height: '100%'},
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  renderWindow.getInteractor().setDesiredUpdateRate(15.0);

// Create Widget container
const widgetContainer = document.createElement('div');
widgetContainer.style.position = 'absolute';
widgetContainer.style.top = 'calc(10px + 1em)';
widgetContainer.style.left = '5px';
widgetContainer.style.background = 'rgba(255, 255, 255, 0.3)';
document.querySelector('body').appendChild(widgetContainer);

// Create Label for preset
const labelContainer = document.createElement('div');
labelContainer.style.position = 'absolute';
labelContainer.style.top = '5px';
labelContainer.style.left = '5px';
labelContainer.style.width = '100%';
labelContainer.style.color = 'white';
labelContainer.style.textAlign = 'center';
labelContainer.style.userSelect = 'none';
labelContainer.style.cursor = 'pointer';
document.querySelector('body').appendChild(labelContainer);

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

for (let i = 0; i < 50; i++) {
    console.log("test");
const reader = vtkXMLImageDataReader.newInstance({ fetchGzip: true });
reader
  .setUrl(`http://192.168.0.16/4DFlow_testData/4D_anatomic/0${i}.vti`, { loadData: true })
  .then(() => reader.loadData())
  .then(() => {
    // Map input read from vti files
    mapper.setInputConnection(reader.getOutputPort());

    // Update LUT based on input range
    const range = reader.getOutputData().getPointData().getScalars().getRange();
    console.log(range);
    lookupTable.setMappingRange(...range);
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
  });
}
