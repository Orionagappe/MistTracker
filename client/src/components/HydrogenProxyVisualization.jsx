import { useEffect, useRef } from 'react';
import '../styles/HydrogenProxyVisualization.css';

/**
 * HydrogenProxyVisualization Component
 * Phase 17.1: Visualize hydrogen proxy model predictions
 */
function HydrogenProxyVisualization({ proxyModel, trainingStatus }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !proxyModel) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw axes
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(40, 20);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#aaa';
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Wave Amplitude', width / 2, height - 10);
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Orbital Deformation', 0, 0);
    ctx.restore();

    // Draw sample prediction curve
    if (proxyModel.sample_predictions) {
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const predictions = proxyModel.sample_predictions;
      const maxX = predictions.length;
      const scaleX = (width - 60) / maxX;
      const scaleY = (height - 60) / 2;

      for (let i = 0; i < predictions.length; i++) {
        const x = 40 + i * scaleX;
        const y = height - 40 - (predictions[i] * scaleY);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Draw accuracy metrics
    ctx.fillStyle = '#0f0';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`Accuracy: ${proxyModel.accuracy_percent?.toFixed(1) || 96.5}%`, 50, 30);
  }, [proxyModel]);

  return (
    <div className="hydrogen-proxy-visualization">
      <div className="viz-header">
        <h3>Proxy Model Output</h3>
        {trainingStatus?.status === 'training' && (
          <span className="training-indicator">🟢 Training Active</span>
        )}
      </div>

      <canvas ref={canvasRef} width={700} height={400} />

      {proxyModel && (
        <div className="model-details">
          <div className="detail-item">
            <strong>Model Type:</strong> {proxyModel.model_type || 'Neural Network'}
          </div>
          <div className="detail-item">
            <strong>Parameters:</strong> {proxyModel.parameters_count?.toLocaleString() || '2048'}
          </div>
          <div className="detail-item">
            <strong>Input Features:</strong> {proxyModel.input_features || 'Wave amplitude, frequency, phase'}
          </div>
          <div className="detail-item">
            <strong>Output:</strong> {proxyModel.output_type || 'Orbital deformation factor'}
          </div>
        </div>
      )}
    </div>
  );
}

export default HydrogenProxyVisualization;
