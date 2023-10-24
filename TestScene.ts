import { _decorator, Component, Node } from 'cc';
import { SCROLL_HORIZONTAL, SCROLL_VERTICAL, ScrollList } from './ScrollList';
const { ccclass, property } = _decorator;

@ccclass('TestScene')
export class TestScene extends Component {


    @property({ type: ScrollList, tooltip: "竖行滚动容器" })
    private vScroll: ScrollList;


    @property({ type: ScrollList, tooltip: "横向滚动容器" })
    private hScroll: ScrollList;


    start() {
        const dataArr = [];
        for (let index = 0; index < 50; index++) {
            dataArr.push(index)
        }

        this.hScroll.setDataList(dataArr, SCROLL_HORIZONTAL, [50, 50, 20]);
        this.vScroll.setDataList(dataArr, SCROLL_VERTICAL, [50, 50, 20]);
    }

}


