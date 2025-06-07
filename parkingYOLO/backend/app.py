import numpy as np
import cv2 as cv
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from ultralytics import YOLO
from PIL import Image

app = Flask(__name__)
# 접근 허용
CORS(app)

# YOLO model
model_car = YOLO('model/carSeg.pt')  # car 단일 segmentation model (character로 사용)
model_dst = YOLO('model/parkingLot.pt')  # 주차 공간 detect model - class 0 : occupied(충돌 처리) / class 1 : vacant(도착 지점)

# 이미지를 base64로 인코딩
def np_to_base64(image_np):
    _, buffer = cv.imencode('.png', image_np)
    return base64.b64encode(buffer).decode('utf-8')

# 선택된 차량 잘라서 캐릭터로 사용(rgba, mask로 주변 지형이 같이 잘리는 것 방지)
def crop_sprite(image, mask, bbox):
    image = cv.cvtColor(image, cv.COLOR_RGB2BGR) # 선택한 차량을 원본의 색과 동일하게 유지

    x1, y1, x2, y2 = map(int, bbox)
    h, w = image.shape[:2]

    # 마스크 크기 조정
    resized_mask = cv.resize(mask, (w, h), interpolation=cv.INTER_LINEAR)
    resized_mask = (resized_mask > 0.5).astype(np.uint8)

    # crop image
    crop_img = image[y1:y2, x1:x2]
    crop_mask = resized_mask[y1:y2, x1:x2]

    if crop_img.shape[0] == 0 or crop_img.shape[1] == 0:
        raise ValueError("Invalid bbox leading to zero-sized crop")

    # sprite 생성
    rgba = np.zeros((crop_img.shape[0], crop_img.shape[1], 4), dtype=np.uint8)
    rgba[..., :3] = crop_img
    rgba[..., 3] = crop_mask * 255
    return rgba

# 차량 각도 확인(이동, 회전 조작)
def get_angle_from_mask(mask):
    mask_uint8 = (mask * 255).astype(np.uint8)
    contours, _ = cv.findContours(mask_uint8, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

    if not contours:
        return 0.0

    # 일반적으로 차량의 길이(진행방향)가 폭보다 김
    rect = cv.minAreaRect(contours[0]) # ((center_x, center_y), (width, height), angle)
    (width, height) = rect[1]
    angle = rect[2]

    # 회전 방향 보정 cv각도 -> canvas각도
    if width < height:
        return angle + 90 # 수직
    else:
        return angle - 90 # 수평

# API endpoint
@app.route('/predict', methods=['POST'])
def predict():
    file = request.files.get('image')
    if file is None:
        return jsonify({"error": "Fail image uploaded"}), 400

    pil_image = Image.open(file.stream).convert("RGB")
    image_np = np.array(pil_image)
    bgr_image = cv.cvtColor(image_np, cv.COLOR_RGB2BGR) # map을 원본 이미지의 색과 동일하게 유지

    # 차량 감지
    detected_car = model_car(pil_image)[0]

    if detected_car.masks is None or len(detected_car.boxes) == 0:
        return jsonify({ "error": "Fail car detected" }), 400

    boxes = detected_car.boxes.xyxy.cpu().numpy()
    classes = detected_car.boxes.cls.cpu().numpy()
    scores = detected_car.boxes.conf.cpu().numpy()
    masks = detected_car.masks.data.cpu().numpy()

    car_infos = []
    for i, c in enumerate(classes):
        if c == 0:
            angle = get_angle_from_mask(masks[i])
            car_infos.append((scores[i], boxes[i].tolist(), masks[i], angle))

    # 정확도 높은 순으로 3개 표시, 그 중에 마우스 클릭으로 선택 
    car_infos = sorted(car_infos, key=lambda x: x[0], reverse=True)[:3]
    if len(car_infos) == 0:
        return jsonify({ "error": "No car detected" }), 400

    car_candidates = [b for (_, b, _, _) in car_infos]
    car_sprites = [np_to_base64(crop_sprite(image_np, m, b)) for (_, b, m, _) in car_infos]
    car_angles = [a for (_, _, _, a) in car_infos]

    # 주차 공간 감지
    detected_dst = model_dst(pil_image)[0]
    dst_boxes = detected_dst.boxes.xyxy.cpu().numpy()
    dst_classes = detected_dst.boxes.cls.cpu().numpy()
    dst_scores = detected_dst.boxes.conf.cpu().numpy()

    destination_box = None
    vacant_boxes = [] # destination
    occupied_boxes = [] # 차량이 주차되어 있는 공간 진입 -> 충돌(감점, starting point 제외)

    for score, box, cls in zip(dst_scores, dst_boxes, dst_classes):
        box_list = box.tolist()
        if cls == 0:
            occupied_boxes.append(box_list)
        elif cls == 1:
            vacant_boxes.append((score, box_list))

    # destination은 1개만
    if vacant_boxes:
        vacant_boxes = sorted(vacant_boxes, key=lambda x: x[0], reverse=True)
        destination_box = vacant_boxes[0][1]

    # return
    return jsonify({
        "background": np_to_base64(bgr_image),
        "car_candidates": car_candidates,
        "car_sprites": car_sprites,
        "car_angles": car_angles,
        "destination_bbox": destination_box,
        "occupied_boxes": occupied_boxes
    })

# flask 서버 실행 (port=5000)
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)