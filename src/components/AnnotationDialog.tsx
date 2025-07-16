import { useState, useEffect, useCallback } from 'react';
import { Annotation } from '../types/annotation';

interface AnnotationDialogProps {
  isOpen: boolean;
  initialTime: number;
  videoFileName: string;
  onSave: (annotation: Annotation) => void;
  onCancel: () => void;
  editingAnnotation?: Annotation | null;
  isEditing?: boolean;
}

export const AnnotationDialog = ({
  isOpen,
  initialTime,
  videoFileName,
  onSave,
  onCancel,
  editingAnnotation,
  isEditing = false
}: AnnotationDialogProps) => {
  const [videoTime, setVideoTime] = useState('00:00:00');
  const [situation, setSituation] = useState('');
  const [recommendedAction, setRecommendedAction] = useState('');
  const [reason, setReason] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ダークモードの検出
  useEffect(() => {
    const checkDarkMode = () => {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(darkModeMediaQuery.matches);
    };

    checkDarkMode();
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addEventListener('change', checkDarkMode);

    return () => {
      darkModeMediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // 入力中のデータをlocalStorageに保存
  const saveDraftToLocalStorage = useCallback(() => {
    const draft = {
      videoTime,
      situation,
      recommendedAction,
      reason,
      videoFileName
    };
    localStorage.setItem('cst-lab-annotation-draft', JSON.stringify(draft));
  }, [videoTime, situation, recommendedAction, reason, videoFileName]);

  // 入力値が変更されたときに自動保存
  useEffect(() => {
    if (isOpen && !isEditing) {
      saveDraftToLocalStorage();
    }
  }, [videoTime, situation, recommendedAction, reason, isOpen, isEditing, saveDraftToLocalStorage]);

  useEffect(() => {
    if (isOpen) {
      if (editingAnnotation) {
        // 編集モード：既存のデータを読み込み
        setVideoTime(editingAnnotation.videoTime);
        setSituation(editingAnnotation.situation);
        setRecommendedAction(editingAnnotation.recommendedAction);
        setReason(editingAnnotation.reason);
      } else {
        // 新規作成モード：初期時間を設定（HH:MM:SS形式）
        const h = Math.floor(initialTime / 3600);
        const m = Math.floor((initialTime % 3600) / 60);
        const s = Math.floor(initialTime % 60);
        const currentTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        
        // localStorageから下書きを読み込む
        const savedDraft = localStorage.getItem('cst-lab-annotation-draft');
        if (savedDraft) {
          try {
            const draft = JSON.parse(savedDraft);
            // 同じ動画ファイルかつ同じ時間の下書きがあれば復元
            if (draft.videoFileName === videoFileName && draft.videoTime === currentTime) {
              setVideoTime(draft.videoTime);
              setSituation(draft.situation || '');
              setRecommendedAction(draft.recommendedAction || '');
              setReason(draft.reason || '');
              return;
            }
          } catch (error) {
            console.error('Failed to parse draft:', error);
          }
        }
        
        // 下書きがない場合は初期値を設定
        setVideoTime(currentTime);
        setSituation('');
        setRecommendedAction('');
        setReason('');
      }
    } else {
      // Reset form when dialog closes
      setVideoTime('00:00:00');
      setSituation('');
      setRecommendedAction('');
      setReason('');
    }
  }, [isOpen, initialTime, editingAnnotation, videoFileName]);

  const handleSave = () => {
    if (!situation.trim()) {
      alert('状況の説明を入力してください');
      return;
    }

    if (!recommendedAction.trim()) {
      alert('推奨行動を入力してください');
      return;
    }

    const annotation: Annotation = {
      videoTime,
      situation,
      recommendedAction,
      reason,
      videoFileName,
      timestamp: new Date().toISOString()
    };

    onSave(annotation);
    // 保存後は下書きを削除
    localStorage.removeItem('cst-lab-annotation-draft');
  };

  if (!isOpen) return null;

  // ダークモード対応のスタイル
  const getStyles = () => ({
    dialog: {
      backgroundColor: isDarkMode ? '#2a2a2a' : 'white',
      padding: '30px',
      borderRadius: '8px',
      border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
      boxShadow: `0 2px 8px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'}`,
      width: '60%',
      height: 'fit-content',
      position: 'sticky' as const,
      top: '10px',
      fontSize: '20px',
      color: isDarkMode ? '#e0e0e0' : '#333333'
    },
    label: {
      color: isDarkMode ? '#e0e0e0' : '#333333',
      fontWeight: 'bold',
      textAlign: 'left' as const
    },
    input: {
      width: '240px',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '20px',
      border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
      borderRadius: '4px',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333333'
    },
    textarea: {
      width: '100%',
      padding: '10px',
      fontSize: '20px',
      border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
      borderRadius: '4px',
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333333'
    },
    cancelButton: {
      padding: '10px 20px',
      fontSize: '20px',
      border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
      borderRadius: '4px',
      cursor: 'pointer',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333333'
    },
    saveButton: {
      padding: '10px 20px',
      fontSize: '20px',
      backgroundColor: isDarkMode ? '#0056b3' : '#007bff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  });

  return (
    <div style={getStyles().dialog}>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ minWidth: '160px', ...getStyles().label }}>
            動画時間:
          </label>
          <input
            type="text"
            value={videoTime}
            onChange={(e) => setVideoTime(e.target.value)}
            pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
            placeholder="HH:MM:SS"
            style={getStyles().input}
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', ...getStyles().label }}>
            状況:
          </label>
          <textarea
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            rows={9}
            style={getStyles().textarea}
            placeholder="例：ロボットが「受付はこちらです」と発言したが、患者の反応が薄い。"
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', ...getStyles().label }}>
            推奨行動:
          </label>
          <textarea
            value={recommendedAction}
            onChange={(e) => setRecommendedAction(e.target.value)}
            rows={6}
            style={getStyles().textarea}
            placeholder="例：「受付はこちらです」と再度発言し直す。"
          />
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', ...getStyles().label }}>
            備考欄（任意）:
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
            style={getStyles().textarea}
            placeholder="補足があれば記入してください。"
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={() => {
              onCancel();
              // キャンセル時も下書きを削除
              localStorage.removeItem('cst-lab-annotation-draft');
            }}
            style={getStyles().cancelButton}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            style={getStyles().saveButton}
          >
            {isEditing ? '更新' : '保存'}
          </button>
        </div>
    </div>
  );
};