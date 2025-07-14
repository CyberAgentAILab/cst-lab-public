import { useState, useEffect } from 'react';
import './App.css';
import { VideoPlayer } from './components/VideoPlayer';
import { AnnotationDialog } from './components/AnnotationDialog';
import { Annotation, VideoFile } from './types/annotation';

function App() {
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>(() => {
    // localStorageから初期データを読み込む
    const savedAnnotations = localStorage.getItem('cst-lab-annotations');
    if (savedAnnotations) {
      try {
        return JSON.parse(savedAnnotations);
      } catch (error) {
        console.error('Failed to parse saved annotations:', error);
        return [];
      }
    }
    return [];
  });
  const [showDialog, setShowDialog] = useState(false);
  const [annotationTime, setAnnotationTime] = useState(0);
  const [editingAnnotation, setEditingAnnotation] = useState<Annotation | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

  // annotationsが更新されたらlocalStorageに保存
  useEffect(() => {
    localStorage.setItem('cst-lab-annotations', JSON.stringify(annotations));
  }, [annotations]);

  useEffect(() => {
    // 動画ファイルを動的に読み込む関数
    const loadVideos = async () => {
      try {
        console.log('Loading videos...');

        // Method 1: manifestファイルから読み込み
        const getVideoUrl = (path: string) => {
          // import.meta.env.BASE_URL はViteが自動的に設定するベースパス
          const basePath = import.meta.env.BASE_URL || '/';
          return path.replace('./', basePath);
        };

        try {
          const manifestUrl = getVideoUrl('./videos-manifest.json');
          const response = await fetch(manifestUrl);

          if (response.ok) {
            const manifest = await response.json();
            console.log('Loaded manifest:', manifest);

            if (manifest.videos && manifest.videos.length > 0) {
              const videoList: VideoFile[] = manifest.videos.map((video: {displayName?: string; name: string; path: string}) => ({
                name: video.displayName || video.name,
                url: getVideoUrl(video.path)
              }));

              console.log('Videos from manifest:', videoList);
              setVideos(videoList);

              if (videoList.length > 0) {
                setSelectedVideo(videoList[0]);
              }
              return;
            }
          }
        } catch {
          console.log('Manifest not found, trying alternative methods...');
        }

        // Method 2: Vite の import.meta.glob を使用
        try {
          const videoModules = import.meta.glob('/public/movies/*.{mp4,webm,avi,mov}', { query: '?url', import: 'default' });
          const videoList: VideoFile[] = [];
          let index = 1;

          for (const path in videoModules) {
            const url = await videoModules[path]();
            const filename = path.split('/').pop() || `動画${index}`;
            const name = filename.replace(/\.[^/.]+$/, "");

            videoList.push({
              name: `動画${index}: ${name}`,
              url: url as string
            });
            index++;
          }

          if (videoList.length > 0) {
            console.log('Videos from import.meta.glob:', videoList);
            setVideos(videoList);
            if (videoList.length > 0) {
              setSelectedVideo(videoList[0]);
            }
            return;
          }
        } catch (globError) {
          console.log('import.meta.glob failed:', globError);
        }

        // Method 3: 代替動画の追加
        console.log('Adding fallback video...');
        
        // 環境変数でPublic/Privateを判定
        const isPublicRepo = import.meta.env.VITE_PUBLIC_REPO === 'true';
        const isPrivateRepo = !isPublicRepo;
        
        if (isPrivateRepo) {
          // Privateリポジトリの場合、公開されているサンプル動画を使用
          const sampleVideo: VideoFile = {
            name: 'サンプル動画（Big Buck Bunny）',
            url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            isDownloading: false,
            downloadProgress: 0
          };
          
          if (videos.length === 0) {
            setVideos([sampleVideo]);
            setSelectedVideo(sampleVideo);
            
            console.warn('Privateリポジトリのため、サンプル動画を使用しています。');
            console.warn('実際の動画を使用する場合は、public/movies/ フォルダに動画ファイルを配置してください。');
          }
        } else {
          // Publicリポジトリの場合、GitHub Releasesからダウンロード
          const releaseVideoUrl = 'https://github.com/CyberAgentAILab/cst-lab/releases/download/movie/test_movie.mp4';
          const releaseVideo: VideoFile = {
            name: 'テスト動画（GitHub Releases）',
            url: releaseVideoUrl,
            isDownloading: true,
            downloadProgress: 0
          };

          if (videos.length === 0) {
            setVideos([releaseVideo]);
            setSelectedVideo(releaseVideo);
            
            // GitHub Releasesから動画をダウンロード
            downloadVideoWithProgress(releaseVideoUrl, releaseVideo.name);
          }
        }

      } catch (error) {
        console.error('Error loading videos:', error);
      }
    };

    // 動画をダウンロードして進捗を追跡
    const downloadVideoWithProgress = async (url: string, videoName: string) => {
      try {
        console.log(`Starting download from: ${url}`);
        
        const response = await fetch(url);
        
        console.log('Download response:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          ok: response.ok
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('ファイルが見つかりません。URLを確認してください。');
          } else if (response.status === 401 || response.status === 403) {
            throw new Error('アクセス権限がありません。Privateリポジトリの場合、ブラウザから直接アクセスできません。');
          }
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }
        
        const contentLength = response.headers.get('content-length');
        const total = parseInt(contentLength || '0', 10);
        let loaded = 0;
        
        console.log(`Content-Length: ${contentLength}, Total bytes: ${total}`);

        const reader = response.body?.getReader();
        const chunks: Uint8Array[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            loaded += value.length;

            // 進捗を更新
            const progress = total > 0 ? Math.round((loaded / total) * 100) : 0;

            // ビデオリストの進捗を更新
            setVideos(prevVideos => 
              prevVideos.map(v => 
                v.name === videoName 
                  ? { ...v, downloadProgress: progress }
                  : v
              )
            );
            
            console.log(`Download progress: ${loaded}/${total} bytes (${progress}%)`);
          }

          // ダウンロード完了後、Blob URLを作成
          const blob = new Blob(chunks, { type: 'video/mp4' });
          const blobUrl = URL.createObjectURL(blob);

          // ビデオリストを更新
          setVideos(prevVideos => 
            prevVideos.map(v => 
              v.name === videoName 
                ? { ...v, url: blobUrl, blobUrl, isDownloading: false, downloadProgress: 100 }
                : v
            )
          );

          // 選択中のビデオも更新
          setSelectedVideo(prev => 
            prev?.name === videoName 
              ? { ...prev, url: blobUrl, blobUrl, isDownloading: false, downloadProgress: 100 }
              : prev
          );
        }
      } catch (error) {
        console.error('Download error:', error);
        
        // エラーメッセージを表示
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`動画のダウンロードに失敗しました:\n${errorMessage}\n\nPrivateリポジトリの場合は、動画ファイルを public/movies フォルダに配置してください。`);
        
        // エラー時は元のURLを使用（ブラウザのデフォルト動作に任せる）
        setVideos(prevVideos => 
          prevVideos.map(v => 
            v.name === videoName 
              ? { ...v, isDownloading: false, downloadProgress: 0 }
              : v
          )
        );
      }
    };

    loadVideos();
  }, [videos.length]);

  const handleAnnotate = (time: number) => {
    setAnnotationTime(time);
    setShowDialog(true);
  };

  const handleSaveAnnotation = (annotation: Annotation) => {
    if (editingIndex !== null) {
      // 既存のアノテーションを更新
      const updatedAnnotations = [...annotations];
      updatedAnnotations[editingIndex] = annotation;
      setAnnotations(updatedAnnotations);
      setEditingIndex(null);
      setEditingAnnotation(null);
    } else {
      // 新しいアノテーションを追加
      setAnnotations([...annotations, annotation]);
    }
    setShowDialog(false);
  };

  const handleCancelAnnotation = () => {
    setShowDialog(false);
    setEditingIndex(null);
    setEditingAnnotation(null);
  };

  const handleEditAnnotation = (annotation: Annotation, index: number) => {
    setEditingAnnotation(annotation);
    setEditingIndex(index);
    setAnnotationTime(parseTimeToSeconds(annotation.videoTime));
    setShowDialog(true);
  };

  const handleDeleteAnnotation = (index: number, event: React.MouseEvent) => {
    event.stopPropagation(); // 親のonClickイベントを防ぐ
    if (window.confirm('このアノテーションを削除してもよろしいですか？')) {
      const updatedAnnotations = annotations.filter((_, i) => i !== index);
      setAnnotations(updatedAnnotations);
    }
  };

  // HH:MM:SS を秒数に変換
  const parseTimeToSeconds = (timeString: string): number => {
    const parts = timeString.split(':');
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  };

  // ダークモード対応のスタイル
  const getStyles = () => ({
    container: {
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333333',
      minHeight: '100vh',
      padding: '20px'
    },
    select: {
      backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333333',
      border: `1px solid ${isDarkMode ? '#555' : '#ccc'}`,
      padding: '0.5em',
      fontSize: '1em',
      borderRadius: '4px',
      marginLeft: '10px'
    },
    annotation: {
      border: `2px solid ${isDarkMode ? '#4a9eff' : '#007bff'}`,
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff',
      color: isDarkMode ? '#e0e0e0' : '#333333',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: `0 2px 4px ${isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'}`
    },
    annotationHover: {
      backgroundColor: isDarkMode ? '#1e3a5f' : '#e3f2fd',
      borderColor: isDarkMode ? '#5ab3ff' : '#0056b3'
    },
    annotationTitle: {
      fontWeight: 'bold',
      marginBottom: '8px',
      color: isDarkMode ? '#5ab3ff' : '#0056b3',
      fontSize: '16px'
    },
    annotationLabel: {
      color: isDarkMode ? '#4a9eff' : '#007bff'
    },
    deleteButton: {
      backgroundColor: isDarkMode ? '#c82333' : '#dc3545',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      padding: '5px 15px',
      cursor: 'pointer',
      fontSize: '14px',
      marginLeft: '10px',
      transition: 'background-color 0.2s'
    },
    deleteButtonHover: {
      backgroundColor: isDarkMode ? '#a01e28' : '#c82333'
    }
  });

  const handleTestEnd = () => {
    // JSONLデータをエクスポート
    const jsonlData = annotations.map(annotation => JSON.stringify(annotation)).join('\n');
    const blob = new Blob([jsonlData], { type: 'application/jsonl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `annotations_${new Date().toISOString()}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="App">
      <h1>接客スキルテスト</h1>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="video-select">動画を選択: </label>
        <select
          id="video-select"
          value={selectedVideo?.name || ''}
          onChange={(e) => {
            const video = videos.find(v => v.name === e.target.value);
            if (video) setSelectedVideo(video);
          }}
          style={getStyles().select}
        >
          {videos.map((video) => (
            <option key={video.name} value={video.name}>
              {video.name}
            </option>
          ))}
        </select>
      </div>

      <div className="task-box">
        <h2>テストの概要</h2>
        <p>
          下記の動画を視聴して、<b><u>「患者に寄り添った最高品質のロボット接客」</u></b>についての提案することがテストとなります。ロボットが顧客満足度全国No.1（従来の人スタッフのみの店舗も含めた）を勝ち取るための接客を目指してください。
        </p>
        <p>
          下記の動画では、調剤薬局の入り口近くに設置された接客ロボットが、患者受付の業務をしている状況です。動画中の接客ロボットは、「処方箋と保険証（またはマイナンバーカード）のスキャン」、「ジェネリック医薬品の希望のヒアリング」など、薬剤師が服薬指導をする前の全ての業務を担うために設置されています。しかしながら、<b><u>動画中の接客ロボットは、決められた最低限の業務を行うことしかできず、患者に寄り添った接客ができていないことが課題</u></b>であり、患者満足度の向上や、次回以降のロボット利用意向、来店促進に繋がっていない状況です。
        </p>
        <p>
          そこで、この接客ロボットが患者に寄り添った最高品質のロボット接客を実現するために、<b><u>「自分であればロボットにどのように接客をさせるか」</u></b>という目線で必要な項目の提案を行ってください。提案いただく接客内容は、どのような「状況」で、ロボットがどんな「推奨行動」を行うべきで、なぜそのような接客が必要と考えたのかの「理由」をセットで提案をしてください。
        </p>
        <p>
        <b>提案例：</b>
          <ul>
            <li><b>「状況」：</b>ロボットが「受付はこちらです」と発言したが、患者の反応が薄い。</li>
            <li><b>「推奨行動」：</b>「受付はこちらです」と再度発言し直す。</li>
            <li><b>「理由」：</b>患者にとっては、ロボットがいる調剤薬局の来店が初めての様子で、ロボットが受付業務をすると認識していなさそうなので、再度発言することで、ロボットが受付業務をしていることを認識してもらうため。</li>
          </ul>
        </p>
      </div>

      <div className="task-box">
        <h2>ロボットのスキル</h2>
        <p>
          動画の中のロボットは、下記のスキルを持っていることとします。<b>下記のスキルの制約の中で、「患者に寄り添った最高品質のロボット接客」の提案</b>を行ってください。
          <ul>
            <li><b>ロボット動作：</b>頭や体の方向を動かすことや、腕を使ってジェスチャができます。ロボットは設置されている場所から移動することはできません。</li>
            <li><b>感情表出：</b>目の色や声色を変えることで、感情を表出することができます。</li>
            <li><b>映像認識：</b>ロボットは、動画内の映像を全て認識することができます。</li>
            <li><b>音声認識：</b>ロボットは、動画内の音声は全て認識することができます。</li>
            <li><b>認識能力：</b>ロボットの映像と音声の認識能力は、人間と同等のレベルであるものとします。テスト受講者が認識できる情報（患者が来店した、困っている、呟いた、等）は、ロボットもすべて認識可能であるとします。</li>
            <li><b>受付方法：</b>ロボットは、タッチパネルを用いた受付業務と、対話を用いた受付業務の両方を行うことができます。例えば、ロボットからの問いかけに対して、患者はタッチパネルで回答することも、発言して回答することもできます。</li>
            <li><b>業務知識：</b>ロボットは、自身の業務内容を理解しており、業務に関連する知識はすべて持っているものとします。</li>
          </ul>
        </p>
      </div>

      <div className="task-box">
        <h2>具体的なテストのやり方</h2>
        <p>
          下記のやり方に従って、あなたが考える「患者に寄り添った最高品質のロボット接客」の提案を行ってください。
          <ol>
            <li><b>「再生」ボタンで視聴開始：</b>「再生」ボタンを押して、動画を視聴してください。「再生ボタン」の下のシークバーを用いて、動画を巻き戻すこともできます。</li>
            <li> <b>「現在時間で提案」ボタンで提案：</b>どこかのタイミングで、ロボットに提案したい、または修正したい接客がある場合、「現在時間で提案」のボタンを押します。</li>
            <li> <b>提案フォームに記入：</b>「状況」「推奨行動」「理由」を記述するフォームが出てくるので、提案する接客内容について詳細に記入してください。全ての記入が終わった後に、「保存」ボタンを押してください。ページの下部の接客提案一覧の項目に、回答した内容が保存されていることを確認してください。一度回答したものを修正したい場合は、保存した回答をクリックすることで修正をすることができます。</li>
            <li> <b>1~3を繰り返す：</b>上記の流れを繰り返し、ロボットの接客提案を思いつく限り、多く提案してください。</li>
            <li> <b>動画全体を通した提案：</b>動画全体を通して改善をすべき提案があれば、再生時間を「0:00」の時点で止めて、具体的な接客提案と合わせて記入してください。</li>
            <li> <b>追加すべき接客スキルの提案：</b>概要で記述された「ロボットのスキル」以外で、現在の接客ロボットに追加すべきスキルがあれば、再生時間を「0:00」の時点で止めて、追加すべきスキル内容についても記入してください（1つに限る）。</li>
            <li> <b>「テスト終了」ボタンでファイルダウンロード：</b>全ての接客提案を記入し終えたら、「テスト終了」ボタンを押すと、「annotations_(時刻).jsonl」というファイルがダウンロードされます。</li>
            <li> <b>ファイルの送信：</b>ダウンロードされたファイルをメールに添付して、期日までに送信してください。</li>
          </ol>
        </p>
      </div>

      <div style={{
        display: 'flex',
        gap: '20px',
        alignItems: 'flex-start',
        maxWidth: '1600px',
        margin: '0 auto'
      }}>
        <div style={{ flex: showDialog ? '0 0 35%' : '1' }}>
          {selectedVideo && (
            <VideoPlayer
              video={selectedVideo}
              onAnnotate={handleAnnotate}
            />
          )}
        </div>
        {showDialog && (
          <div style={{ flex: '0 0 60%', minWidth: '900px' }}>
            <AnnotationDialog
              isOpen={showDialog}
              initialTime={annotationTime}
              videoFileName={selectedVideo?.name || ''}
              onSave={handleSaveAnnotation}
              onCancel={handleCancelAnnotation}
              editingAnnotation={editingAnnotation}
              isEditing={editingIndex !== null}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: '20px' }}>
        <button onClick={handleTestEnd} style={{ padding: '10px 20px', fontSize: '16px' }}>
          テスト終了
        </button>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h3>接客提案一覧 ({annotations.length}件)</h3>
        {annotations.length > 0 && (
          <div style={{ textAlign: 'left', maxWidth: '1200px', margin: '0 auto' }}>
            {annotations.map((annotation, index) => (
              <div
                key={index}
                style={getStyles().annotation}
                onClick={() => handleEditAnnotation(annotation, index)}
                onMouseEnter={(e) => {
                  const styles = getStyles();
                  e.currentTarget.style.backgroundColor = styles.annotationHover.backgroundColor;
                  e.currentTarget.style.borderColor = styles.annotationHover.borderColor;
                }}
                onMouseLeave={(e) => {
                  const styles = getStyles();
                  e.currentTarget.style.backgroundColor = styles.annotation.backgroundColor;
                  e.currentTarget.style.borderColor = styles.annotation.border.split(' ')[2];
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={getStyles().annotationTitle}>
                      {annotation.videoTime} - {annotation.videoFileName}
                    </div>
                    <div style={{ marginBottom: '8px', color: getStyles().annotation.color }}>
                      <strong style={getStyles().annotationLabel}>状況:</strong> {annotation.situation}
                    </div>
                    <div style={{ marginBottom: '8px', color: getStyles().annotation.color }}>
                      <strong style={getStyles().annotationLabel}>推奨行動:</strong> {annotation.recommendedAction}
                    </div>
                    <div style={{ color: getStyles().annotation.color }}>
                      <strong style={getStyles().annotationLabel}>理由:</strong> {annotation.reason}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteAnnotation(index, e)}
                    style={getStyles().deleteButton}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = getStyles().deleteButtonHover.backgroundColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = getStyles().deleteButton.backgroundColor;
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

export default App;