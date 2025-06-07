import React, { useRef, useEffect } from 'react';

// map 좌표, canvas 좌표, yolo 좌표 통일성 유지 필요
const MapViewer = ({
  backgroundImg,      // 배경(map)
  carSprite,          // 선택한 차량(player character)
  carState,           // character 위치 정보
  destinationBox,     // destination(vacant)
  carCandidates,      // YOLO가 detect한 차량(선택지)
  onCandidateClick,   // 선택(마우스 클릭)
  startingBox         // starting point(선택된 차량 위치)
}) => {
  const canvasRef = useRef();
  const scaleRef = useRef({ scaleX: 1, scaleY: 1 }); // yolo 크기 -> canvas 크기 변환용 scale저장

  // map, sprite 자동 새로고침
  useEffect(() => {
    if (!backgroundImg) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const bgImg = new Image();  // 배경
    const carImg = new Image(); // sprite

    let scaleX = 1;
    let scaleY = 1;

    // drawing
    const tryDraw = () => {
      const rect = canvas.getBoundingClientRect(); // browser 크기, 위치

      // 화면 크기 맞춤
      canvas.width = rect.width;
      canvas.height = rect.height;

      // 원본 image(yolo)
      const naturalWidth = bgImg.naturalWidth || bgImg.width;
      const naturalHeight = bgImg.naturalHeight || bgImg.height;

      // yolo -> canvas 좌표
      scaleX = rect.width / naturalWidth;
      scaleY = rect.height / naturalHeight;

      scaleRef.current = { scaleX, scaleY };

      // 초기화, drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); // canvas 크기에 맞춤

      // 선택할 수 있는 차량 표시(신뢰도 top3)
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'red';
      ctx.font = '12px sans-serif';
      carCandidates.forEach(([x1, y1, x2, y2], i) => {
        ctx.strokeRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);
        ctx.fillText(`car${i + 1}`, x1 * scaleX + 3, y1 * scaleY + 15);
      });

      // 시작 지점 표시(starting point, 선택된 차량 원래 위치)
      if (startingBox) {
        const [x1, y1, x2, y2] = startingBox;
        const centerX = (x1 + x2) / 2 * scaleX;
        const centerY = (y1 + y2) / 2 * scaleY;
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(x1 * scaleX, y1 * scaleY, (x2 - x1) * scaleX, (y2 - y1) * scaleY);
        ctx.fillStyle = 'blue';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('STARTING POINT', centerX, centerY);
      }

      // 목적지 표시(destination = vacant 신뢰도 top1)
      if (destinationBox) {
        const [dx1, dy1, dx2, dy2] = destinationBox;
        const centerX = (dx1 + dx2) / 2 * scaleX;
        const centerY = (dy1 + dy2) / 2 * scaleY;
        ctx.strokeStyle = 'green';
        ctx.lineWidth = 3;
        ctx.strokeRect(dx1 * scaleX, dy1 * scaleY, (dx2 - dx1) * scaleX, (dy2 - dy1) * scaleY);
        ctx.fillStyle = 'green';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DESTINATION', centerX, centerY );
      }

      // 선택된 차량 drawing
      if (carState) {
        const { x, y, width, height, angle } = carState;
        ctx.save();
        ctx.translate(x * scaleX, y * scaleY);
        ctx.rotate((angle * Math.PI) / 180); // radian 변환
        ctx.drawImage(
          carImg,
          -width / 2 * scaleX,
          -height / 2 * scaleY,
          width * scaleX,
          height * scaleY
        );
        ctx.restore();
      } else {
        console.warn('carState가 없음 -> 차량 미선택');
      }
    };

    bgImg.onload = () => {
      if (!carSprite) tryDraw();            // 배경만
      else if (carImg.complete) tryDraw();  // 차량 먼저 load
    };

    carImg.onload = () => {
      if (bgImg.complete) tryDraw();        // 배경 먼저 load
    };

    bgImg.src = backgroundImg;
    if (carSprite) carImg.src = carSprite;

    // 화면 resize -> 다시 그리기
    window.addEventListener('resize', tryDraw);
    return () => window.removeEventListener('resize', tryDraw);
  }, [backgroundImg, carSprite, carState, destinationBox, carCandidates]);

  // 차량 클릭 감지(마우스 좌표 , canvas 좌표 통일)
  const handleClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const { scaleX, scaleY } = scaleRef.current;

    // 마우스 -> canvas -> yolo 좌표
    const x = (e.clientX - rect.left) / rect.width * canvas.width / scaleX;
    const y = (e.clientY - rect.top) / rect.height * canvas.height / scaleY;

    // 박스 내부 범위 클릭
    carCandidates.forEach(([x1, y1, x2, y2], i) => {
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        onCandidateClick(i);
      }
    });
  };

  // canvas 정렬
  return (
    <div style={{
      flex: 1,
      width: '100%',
      height: 'calc(100vh - 160px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '10px',
      boxSizing: 'border-box',
    }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: '100%',
          height: '100%',
          border: '1px solid gray',
          cursor: 'pointer',
          display: 'block',
        }}
      />
    </div>
  );
};

export default MapViewer;