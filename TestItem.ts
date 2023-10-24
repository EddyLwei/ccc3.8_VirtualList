import { _decorator, Label, Node } from 'cc';
import { ScrollListItem } from './ScrollListItem';
const { ccclass, property } = _decorator;

@ccclass('TestItem')
export class TestItem extends ScrollListItem {


    @property({ type: Label, tooltip: "文本" })
    private txt: Label;


    onItemRender(data: any, ...param: any[]): void {
        this.txt.string = data;
    }


}


