// map 좌표, canvas 좌표, yolo 좌표 통일성 유지 필요

// 차량 박스, 회전각 사용해 차량 상태 객체 생성
export function createCarStateFromBox(box, angle = 0) {
  const [x1, y1, x2, y2] = box; // YOLO box
  const width = x2 - x1;
  const height = y2 - y1;
  // 중심
  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;

  return {
    // 현재, 초기 좌표(충돌처리 제외)
    x: cx,
    y: cy,
    angle,
    width,
    height,
    startX: cx,
    startY: cy,
  };
}

// 차량 움직임 컨트롤
export function handleCarMovement(carState, key) {
  const { x, y, angle } = carState;
  const speed = 5;
  const rad = ((angle + 90) * Math.PI) / 180; // radian 변환

  // 움직임 업데이트
  let newState = { ...carState };

  switch (key) {
    // 위, 아래 방향키 -> 전진, 후진
    case 'ArrowUp':
      newState.x += speed * Math.cos(rad);
      newState.y += speed * Math.sin(rad);
      break;
    case 'ArrowDown':
      newState.x -= speed * Math.cos(rad);
      newState.y -= speed * Math.sin(rad);
      break;
    // 좌, 우 방향키 -> 회전
    case 'ArrowLeft':
      newState.angle -= 10;
      break;
    case 'ArrowRight':
      newState.angle += 10;
      break;
    default:
      return carState;
  }

  // 이전 상태 반영 및 이동, 회전한 상태 갱신
  return newState;
}