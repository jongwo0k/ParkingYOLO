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

mouse click으로 빨간 박스 안의 차량 중 하나 선택

keyboard 방향키 사용해서 조종

up, down : 전진, 후진

left, right : 회전

# Gameplay Demo
![playDemo](./playDemo/playSample1_1.gif)

![playDemo](./playDemo/playSample2_1.gif)

# 개선 필요

top view가 아닌 이미지의 경우 사용하기 어려움 (getPerspectiveTransform, warpPerspective 사용 고려)

car만 정확히 자르지 못할 경우(ex : 대각선) 차량 움직임이 자연스럽지 못함

이미지 내에 detect되지 않는 장애물은 충돌 처리 불가


# Reference
roboflow dataset parking space 3,4 by parkinglotdetectionteamcentaurus, Car_segmentation by vince0404

Ultralytics YOLOv8
