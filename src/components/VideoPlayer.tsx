import { useRef, useState, useEffect } from 'react';
import { VideoFile } from '../types/annotation';

interface VideoPlayerProps {
  video: VideoFile;
  onAnnotate: (time: number) => void;
}

export const VideoPlayer = ({ video, onAnnotate }: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    console.log('Loading video:', video.url);
    console.log('Base URL:', import.meta.env.BASE_URL);
    console.log('Video path debug:', {
      name: video.name,
      url: video.url,
      baseUrl: import.meta.env.BASE_URL,
      isDownloading: video.isDownloading,
      downloadProgress: video.downloadProgress
    });
    
    // ダウンロード中の場合は処理をスキップ
    if (video.isDownloading) {
      return;
    }

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
    };

    const handlePlayPause = () => {
      setIsPlaying(!videoElement.paused);
    };

    const handleError = () => {
      console.error('Video load error:', {
        videoUrl: video.url,
        videoSrc: videoElement.src,
        error: videoElement.error,
        networkState: videoElement.networkState,
        readyState: videoElement.readyState
      });
      setError(`動画の読み込みに失敗しました: ${video.url}`);
      
      // 別のパターンも試してみる
      const alternativeUrl = video.url.replace('/cst/', '/cst/');
      console.log('Trying alternative URL:', alternativeUrl);
    };

    const handleLoadStart = () => {
      setError(null);
    };

    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('play', handlePlayPause);
    videoElement.addEventListener('pause', handlePlayPause);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('loadstart', handleLoadStart);

    return () => {
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('play', handlePlayPause);
      videoElement.removeEventListener('pause', handlePlayPause);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('loadstart', handleLoadStart);
    };
  }, [video]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current && !isNaN(time)) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) {
      return '0:00';
    }
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ダークモード対応のスタイル
  const getStyles = () => ({
    container: {
      maxWidth: '800px',
      margin: '0 auto'
    },
    error: {
      color: isDarkMode ? '#ff6b6b' : 'red',
      padding: '10px',
      backgroundColor: isDarkMode ? '#4a1414' : '#ffe6e6',
      border: `1px solid ${isDarkMode ? '#ff6b6b' : '#ff0000'}`,
      borderRadius: '4px',
      marginBottom: '10px'
    },
    controls: {
      marginTop: '10px',
      color: isDarkMode ? '#e0e0e0' : '#333333'
    },
    timeDisplay: {
      marginLeft: '20px',
      color: isDarkMode ? '#e0e0e0' : '#333333'
    },
    slider: {
      width: '100%',
      backgroundColor: isDarkMode ? '#2a2a2a' : '#ffffff'
    }
  });

  return (
    <div style={getStyles().container}>
      {error && (
        <div style={getStyles().error}>
          {error}
        </div>
      )}
      
      {/* ダウンロード進捗表示 */}
      {video.isDownloading && (
        <div style={{
          backgroundColor: isDarkMode ? '#2a2a2a' : '#f0f0f0',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <h3 style={{ color: isDarkMode ? '#e0e0e0' : '#333' }}>
            動画をダウンロード中...
          </h3>
          <div style={{
            width: '100%',
            height: '20px',
            backgroundColor: isDarkMode ? '#1a1a1a' : '#ddd',
            borderRadius: '10px',
            overflow: 'hidden',
            marginTop: '10px'
          }}>
            <div style={{
              width: `${video.downloadProgress || 0}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ 
            marginTop: '10px', 
            color: isDarkMode ? '#e0e0e0' : '#666' 
          }}>
            {video.downloadProgress || 0}%
          </p>
        </div>
      )}
      
      {!video.isDownloading && (
        <video
          ref={videoRef}
          src={video.url}
          style={{ width: '100%', height: 'auto' }}
          controls={false}
        />
      )}
      
      {!video.isDownloading && (
        <>
          <div style={getStyles().controls}>
            <button onClick={togglePlayPause} style={{ marginRight: '10px' }}>
              {isPlaying ? '一時停止' : '再生'}
            </button>
            
            <button onClick={() => {
              // 動画を一時停止
              if (videoRef.current && !videoRef.current.paused) {
                videoRef.current.pause();
              }
              onAnnotate(currentTime);
            }}>
              現在時間で提案
            </button>
            
            <span style={getStyles().timeDisplay}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div style={getStyles().controls}>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              style={getStyles().slider}
              disabled={!duration}
            />
          </div>
        </>
      )}
    </div>
  );
};