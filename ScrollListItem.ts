
import { _decorator, Component, } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('ScrollListItem')
export class ScrollListItem extends Component {

    /**滚动列表数据变更*/
    onItemRender(data, ...param: any[]) { }

}
