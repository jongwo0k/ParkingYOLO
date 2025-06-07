# ParkingYOLO
A game where you control and park a car detected by YOLO in the uploaded map image

# 주요기능
맵으로 사용하고 싶은 top view 주차장 이미지 업로드

2개의 YOLO 모델 사용
- car : 차량을 감지, 사용자 캐릭터로 선택 가능
- 주차장(이미 주차되어 있는 공간occupied, 빈 공간vacant)
- 신뢰도 기준으로 car 3대, destination(vacant) 1곳 표시

yolo가 detect한 이미 주차되어 있는 공간occupied, 선택되지 않은 차량에 충돌 시 감점

3대의 차량 중 하나를 선택 한 뒤 destination까지 높은 점수로 도달해 보세요

# 맵으로 사용할 이미지
top view의 주차장 이미지
cartoon style, 실제 촬영한 이미지 모두 가능(sampleMap1,2)

![demo](./playDemo/start1.png)

![demo](./playDemo/start2.png)

# 조작법
keyboard 방향키 사용
up, down : 전진, 후진
left, right : 회전

# play

# Reference
roboflow dataset
Ultralytics YOLOv8
