import { useState, useEffect, useRef } from 'react';
import { categoryAPI, itemAPI, analysisAPI } from '../api';
import { getObjectPhysicsConfiguration } from '../utils/AtomTypeSystem.js';
import PhysicsPage from '../pages/PhysicsPage';
import SessionManager from './SessionManager';
import '../styles/TimelineDetail.css';
import '../styles/SessionManager.css';

function TimelineDetail({ timeline, onBack, ws }) {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState({});
  const [newCategory, setNewCategory] = useState('');
  const [newItemByCat, setNewItemByCat] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [anomalies, setAnomalies] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [showPhysics, setShowPhysics] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Phase 6.3: Atom registration tracking
  const registeredAtomsRef = useRef(new Map());
  const registrationQueueRef = useRef(new Map());
  const [registrationStatus, setRegistrationStatus] = useState({});

  useEffect(() => {
    loadCategories();
    loadAnomalies();
  }, [timeline.id]);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'category-update' || message.type === 'item-update') {
            loadCategories();
          }
        } catch (err) {
          console.error('WebSocket message parse error:', err);
        }
      };
    }
  }, [ws]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getCategories(timeline.id);
      setCategories(response.data.categories || []);

      // Load items for each category
      const itemsData = {};
      for (const cat of response.data.categories || []) {
        try {
          const itemsResponse = await itemAPI.getItems(cat.id);
          itemsData[cat.id] = itemsResponse.data.items || [];
        } catch (err) {
          console.error(`Failed to load items for category ${cat.id}:`, err);
        }
      }
      setItems(itemsData);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const response = await analysisAPI.getAnomalies(timeline.id);
      setAnomalies(response.data);
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      await categoryAPI.createCategory(timeline.id, newCategory);
      setNewCategory('');
      loadCategories();
    } catch (err) {
      setError('Failed to create category');
      console.error(err);
    }
  };

  const handleCreateItem = async (categoryId, e) => {
    e.preventDefault();
    const itemValue = newItemByCat[categoryId] || '';
    if (!itemValue.trim()) return;

    try {
      await itemAPI.createItem(categoryId, itemValue);
      setNewItemByCat((prev) => ({ ...prev, [categoryId]: '' }));
      loadCategories();
    } catch (err) {
      setError('Failed to create item');
      console.error(err);
    }
  };

  // Phase 5.3: Register timeline item as atom in physics engine (with retry logic)
  const handleRegisterAtomForPhysics = (item, categoryName) => {
    const atomId = `${timeline.id}-${item.id}`;
    
    try {
      // Get physics configuration (atom type, electron clouds, etc.)
      const physicsConfig = getObjectPhysicsConfiguration({
        category: categoryName,
        item: item,
        metadata: item.metadata
      });

      // Only register if it's a recognized atom type
      if (!physicsConfig || !physicsConfig.atomType) {
        console.log(`[Physics] Item "${item.itemValue}" not mapped to atom type, skipping physics registration`);
        return;
      }

      console.log(`[Physics] Registering ${physicsConfig.atomType} atom from timeline item`);

      // Attempt to send with retry logic
      const attemptRegistration = (retryCount = 0, maxRetries = 3) => {
        // Check WebSocket state
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          if (retryCount < maxRetries) {
            // Queue retry
            const backoffMs = 100 * Math.pow(2, retryCount); // Exponential backoff: 100ms, 200ms, 400ms
            console.warn(`[Physics] WebSocket not ready. Retrying in ${backoffMs}ms (attempt ${retryCount + 1}/${maxRetries})`);
            
            setRegistrationStatus(prev => ({
              ...prev,
              [atomId]: { status: 'pending', attempt: retryCount + 1, maxRetries }
            }));

            setTimeout(() => attemptRegistration(retryCount + 1, maxRetries), backoffMs);
            return;
          } else {
            // Max retries exceeded
            console.error(`[Physics] Failed to register atom after ${maxRetries} attempts`);
            setError(`Failed to register atom: WebSocket not available after ${maxRetries} attempts`);
            setRegistrationStatus(prev => ({
              ...prev,
              [atomId]: { status: 'failed', reason: 'WebSocket timeout' }
            }));
            return;
          }
        }

        // Send registration message
        try {
          ws.send(JSON.stringify({
            type: 'registerAtom',
            data: {
              ...physicsConfig,
              atomId: atomId
            }
          }));

          // Mark as registered
          registeredAtomsRef.current.set(atomId, { item, categoryName, physicsConfig });
          setRegistrationStatus(prev => ({
            ...prev,
            [atomId]: { status: 'success', currentTime: Date.now() }
          }));

          console.log(`[Physics] ✓ Atom registered: ${physicsConfig.atomType} (ID: ${atomId})`);
        } catch (sendErr) {
          console.error(`[Physics] Error sending registration message:`, sendErr);
          setError(`Failed to send registration: ${sendErr.message}`);
          setRegistrationStatus(prev => ({
            ...prev,
            [atomId]: { status: 'failed', reason: sendErr.message }
          }));
        }
      };

      attemptRegistration(0, 3);
    } catch (err) {
      console.error('[Physics] Error preparing atom registration:', err);
      setError(`Failed to register atom: ${err.message}`);
      setRegistrationStatus(prev => ({
        ...prev,
        [atomId]: { status: 'failed', reason: err.message }
      }));
    }
  };

  // Phase 6.3: Unregister atoms on unmount
  useEffect(() => {
    return () => {
      // Clean up registered atoms when component unmounts
      if (ws && ws.readyState === WebSocket.OPEN) {
        registeredAtomsRef.current.forEach((atomData, atomId) => {
          try {
            ws.send(JSON.stringify({
              type: 'unregisterAtom',
              data: { atomId }
            }));
          } catch (err) {
            console.warn(`[Physics] Error unregistering atom ${atomId}:`, err);
          }
        });
      }
      registeredAtomsRef.current.clear();
    };
  }, [ws]);

  const toggleCategory = (categoryId) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Phase 14: Show physics simulation page if session is selected
  if (showPhysics && selectedSession) {
    return (
      <PhysicsPage
        timeline={timeline}
        onBack={() => {
          setShowPhysics(false);
          setSelectedSession(null);
        }}
      />
    );
  }

  // Phase 14: Show session manager if entering physics mode
  if (showPhysics) {
    return (
      <div className="timeline-detail session-picker">
        <div className="session-picker-header">
          <button onClick={() => setShowPhysics(false)} className="btn-back">← Back to Timeline</button>
          <h2>Physics Simulation</h2>
        </div>
        <SessionManager
          timelineId={timeline.id}
          onNewSession={(session) => {
            setSelectedSession(session);
          }}
          onResumeSession={(session) => {
            setSelectedSession(session);
          }}
        />
      </div>
    );
  }

  return (
    <div className="timeline-detail">
      <div className="timeline-detail-header">
        <div className="header-left">
          <button onClick={onBack} className="btn-back">← Back to Timelines</button>
          <h2>{timeline.value}</h2>
        </div>
        <button onClick={() => setShowPhysics(true)} className="btn-physics">
          ⚛️ Physics Simulation
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {anomalies && anomalies.anomalyCount > 0 && (
        <div className="anomalies-alert">
          <strong>⚠ Anomalies Detected:</strong> {anomalies.anomalyCount} of {anomalies.totalItems} items
        </div>
      )}

      <div className="create-category-section">
        <h3>Add Category</h3>
        <form onSubmit={handleCreateCategory}>
          <div className="form-group">
            <input
              type="text"
              placeholder="New category name..."
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
            <button type="submit" disabled={loading} className="btn-primary">
              Add Category
            </button>
          </div>
        </form>
      </div>

      <div className="categories-section">
        <h3>Categories ({categories.length})</h3>
        {loading && <div className="loading-spinner">Loading...</div>}

        {!loading && categories.length === 0 && (
          <div className="empty-state">
            <p>No categories yet. Create one to get started!</p>
          </div>
        )}

        {!loading && categories.length > 0 && (
          <div className="categories-list">
            {categories.map((category) => (
              <div key={category.id} className="category-section">
                <button
                  className="category-header"
                  onClick={() => toggleCategory(category.id)}
                >
                  <span className="category-toggle">
                    {expandedCategory === category.id ? '▼' : '▶'}
                  </span>
                  <span className="category-name">{category.category}</span>
                  <span className="item-count">
                    ({items[category.id]?.length || 0} items)
                  </span>
                </button>

                {expandedCategory === category.id && (
                  <div className="category-content">
                    <form onSubmit={(e) => handleCreateItem(category.id, e)}>
                      <div className="form-group">
                        <input
                          type="text"
                          placeholder="Add new item..."
                          value={newItemByCat[category.id] || ''}
                          onChange={(e) =>
                            setNewItemByCat((prev) => ({
                              ...prev,
                              [category.id]: e.target.value,
                            }))
                          }
                        />
                        <button type="submit" className="btn-secondary">+</button>
                      </div>
                    </form>

                    <div className="items-list">
                      {items[category.id]?.length === 0 && (
                        <p className="empty-items">No items in this category</p>
                      )}
                      {items[category.id]?.map((item, idx) => {
                        const atomId = `${timeline.id}-${item.id}`;
                        const regStatus = registrationStatus[atomId];
                        
                        return (
                          <div key={item.id || idx} className="item">
                            <div className="item-content">{item.itemValue}</div>
                            <div className="item-actions">
                              <button 
                                className="btn-atom-physics"
                                onClick={() => handleRegisterAtomForPhysics(item, category.category)}
                                title="Register as atom in physics simulation"
                                disabled={regStatus?.status === 'pending'}
                              >
                                ⚛️
                              </button>
                              
                              {/* Phase 6.3: Registration status indicator */}
                              {regStatus && regStatus.status === 'pending' && (
                                <span className="reg-status pending" title={`Attempt ${regStatus.attempt}/${regStatus.maxRetries}`}>
                                  ⏳
                                </span>
                              )}
                              {regStatus && regStatus.status === 'success' && (
                                <span className="reg-status success" title="Atom registered in physics engine">
                                  ✓
                                </span>
                              )}
                              {regStatus && regStatus.status === 'failed' && (
                                <span className="reg-status failed" title={`Failed: ${regStatus.reason}`}>
                                  ✕
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimelineDetail;
