// map 좌표, canvas 좌표, yolo 좌표 통일성 유지 필요
// destination box에 들어가면 게임 clear
export const hasReachedDestination = (carState, destBox) => {
    if (!carState || !destBox) return false;

    const [dx1, dy1, dx2, dy2] = destBox;
    const { x, y, width, height } = carState;

    const x1 = x - width / 2;
    const x2 = x + width / 2;
    const y1 = y - height / 2;
    const y2 = y + height / 2;

    // 도착 조건 완화(업로드한 map, model이 detect한 object별로 box크기 차이 존재)
    const margin = 15;

    return (
        x1 >= dx1 - margin &&
        x2 <= dx2 + margin &&
        y1 >= dy1 - margin &&
        y2 <= dy2 + margin
    );
};

// 충돌 감지
export const isColliding = (box1, box2) => {
    const [x1, y1, x2, y2] = box1;
    const [a1, b1, a2, b2] = box2;
    return !(x2 < a1 || x1 > a2 || y2 < b1 || y1 > b2);
};

// 자신, starting point 주변 범위는 충돌 지역에서 제외(시작하자마자 감점 방지)
const nearBox = (box, margin) => {
    const [x1, y1, x2, y2] = box;
    return [x1 - margin, y1 - margin, x2 + margin, y2 + margin];
};

export const excludeStartingBox = (boxes, startingBox, margin = 30) => {
    if (!startingBox) return boxes;
    const near = nearBox(startingBox, margin);
    return boxes.filter((box) => !isColliding(box, near));
};