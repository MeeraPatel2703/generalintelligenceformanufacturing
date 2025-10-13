/**
 * Connection Editor Modal
 *
 * Configure connection properties:
 * - Lag time (transport/buffer delay)
 * - Capacity (max entities in transit)
 */

import { useState } from 'react';
import { useFactoryStore, Connection } from '../../store/factoryStore';

interface ConnectionEditorProps {
  connection: Connection;
  onClose: () => void;
}

export function ConnectionEditor({ connection, onClose }: ConnectionEditorProps) {
  const updateConnection = useFactoryStore(state => state.updateConnection);
  const removeConnection = useFactoryStore(state => state.removeConnection);
  const machines = useFactoryStore(state => state.machines);

  const [lagTime, setLagTime] = useState(connection.lagTime);
  const [capacity, setCapacity] = useState(connection.capacity);

  // Get machine names for display
  const fromMachine = machines.find(m => m.id === connection.from);
  const toMachine = machines.find(m => m.id === connection.to);

  // Handle save
  const handleSave = () => {
    updateConnection(connection.id, {
      lagTime,
      capacity
    });
    onClose();
  };

  // Handle delete
  const handleDelete = () => {
    if (confirm('Delete this connection?')) {
      removeConnection(connection.id);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="connection-editor" onClick={(e) => e.stopPropagation()}>
        <h2>⚙️ Connection Settings</h2>

        <div className="connection-info">
          <div className="info-row">
            <span className="label">From:</span>
            <span className="value">{fromMachine?.id || connection.from}</span>
          </div>
          <div className="info-row">
            <span className="label">To:</span>
            <span className="value">{toMachine?.id || connection.to}</span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="lagTime">
            ⏱️ Lag Time (minutes)
            <span className="help-text">Transport/buffer delay between machines</span>
          </label>
          <input
            id="lagTime"
            type="number"
            min="0"
            max="60"
            step="0.5"
            value={lagTime}
            onChange={(e) => setLagTime(parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="capacity">
            📦 Capacity (entities)
            <span className="help-text">Max parts that can be in transit simultaneously</span>
          </label>
          <input
            id="capacity"
            type="number"
            min="1"
            max="20"
            value={capacity}
            onChange={(e) => setCapacity(parseInt(e.target.value))}
          />
        </div>

        <div className="button-group">
          <button className="btn-save" onClick={handleSave}>
            ✓ Save
          </button>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-delete" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>

        <style>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .connection-editor {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          }

          .connection-editor h2 {
            margin: 0 0 1.5rem 0;
            font-size: 1.5rem;
            color: #333;
          }

          .connection-info {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1.5rem;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 0.5rem 0;
          }

          .info-row .label {
            font-weight: 600;
            color: #666;
          }

          .info-row .value {
            color: #3B82F6;
            font-family: monospace;
          }

          .form-group {
            margin-bottom: 1.5rem;
          }

          .form-group label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #333;
          }

          .help-text {
            display: block;
            font-size: 0.875rem;
            font-weight: 400;
            color: #666;
            margin-top: 0.25rem;
          }

          .form-group input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e0e0e0;
            border-radius: 6px;
            font-size: 1rem;
            transition: border-color 0.2s;
          }

          .form-group input:focus {
            outline: none;
            border-color: #3B82F6;
          }

          .button-group {
            display: flex;
            gap: 0.75rem;
            margin-top: 2rem;
          }

          .button-group button {
            flex: 1;
            padding: 0.75rem;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-save {
            background: #10B981;
            color: white;
          }

          .btn-save:hover {
            background: #059669;
          }

          .btn-cancel {
            background: #e0e0e0;
            color: #333;
          }

          .btn-cancel:hover {
            background: #d0d0d0;
          }

          .btn-delete {
            background: #EF4444;
            color: white;
          }

          .btn-delete:hover {
            background: #DC2626;
          }
        `}</style>
      </div>
    </div>
  );
}

