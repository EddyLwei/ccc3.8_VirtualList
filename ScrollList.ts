

/**横向排布拖动*/
export const SCROLL_HORIZONTAL: number = 1;
/**竖向排布拖动*/
export const SCROLL_VERTICAL: number = 2;

import { _decorator, Node, Prefab, instantiate, ScrollView, UITransform, Vec3, log } from 'cc';
import { ScrollListItem } from './ScrollListItem';

const { ccclass, property } = _decorator;

@ccclass('ScrollList')
export class ScrollList extends ScrollView {


    /**item子节点预制体*/
    @property({ type: Prefab, tooltip: "item子节点预制体" })
    itemPrefab: Prefab = null;

    /**单条记录高度*/
    private _itemSize: number;

    /**需要多少个记录组件 在可视范围内+2条*/
    private _numItem: number = 0;

    private _itemArr: Array<Node> = [];

    /**开始端下标*/
    private _itemIndex: number = 0;
    /**结束端下标*/
    private _dataIndex: number = 0;

    /**数据源*/
    private _dataArr: any[];

    /**滚动方向*/
    private _direction: number = 0;

    /**间隙 0=开始边框，1=结束边框，2=间隙*/
    private _gapNum: number[];

    /**子节点刷新绑定事件，或者使用item继承的模式*/
    public onItemRender: Function;

    start() {
        super.start();
        this.node.on('scrolling', this.scrollCheck, this);
    }

    onDestroy() {
        super.onDestroy();
        if (this.node) {
            this.node.off('scrolling', this.scrollCheck, this);
        }
    }


    /**设置数据
     * @param dataArr : 数据源
     * @param direction : 滚动方向，默认上下
     * @param gap : [开始边框距离，结束边框距离，每个之间空隙]
    */
    public setDataList(dataArr: any[], direction: number = SCROLL_VERTICAL, gap?: number[]) {
        this._dataArr = dataArr;
        this._direction = direction;
        this._gapNum = gap;
        this.createItem();
    }


    /**获得数据后开始创建*/
    private createItem() {

        let _showSize = this.node.getComponent(UITransform).height;
        //获得预制体的高度
        if (!this._itemSize) {
            let pNode = instantiate(this.itemPrefab);
            if (this._direction == SCROLL_HORIZONTAL) {
                this._itemSize = pNode.getComponent(UITransform).contentSize.width;
                _showSize = this.node.getComponent(UITransform).width;
            }
            else {
                this._itemSize = pNode.getComponent(UITransform).contentSize.height;
            }
            pNode.destroy();
            // log("---_itemSize--", this._itemSize);
        }

        //可视范围，对应可以创建多少个实体单例item
        this._numItem = Math.floor(_showSize / this._itemSize) + 2;
        log(_showSize, "初始化获得数量：", this._numItem)
        if (this._dataArr.length < this._numItem) {
            this._numItem = this._dataArr.length;
        }

        this._itemArr.length = 0;
        for (let index = 0; index < this._numItem; index++) {
            let pNode = instantiate(this.itemPrefab);
            pNode.parent = this.content;
            this._itemArr.push(pNode);
            this.itemRender(pNode, index);
        }

        //设置容器大小
        let contentSize = this._itemSize * this._dataArr.length;
        //前面距离边框
        if (this._gapNum && this._gapNum[0]) {
            contentSize += this._gapNum[0];
        }
        //后面距离边框
        if (this._gapNum && this._gapNum[1]) {
            contentSize += this._gapNum[1];
        }
        //间隙距离
        if (this._gapNum && this._gapNum[2]) {
            contentSize += this._gapNum[2] * (this._dataArr.length - 1);
        }

        if (this._direction == SCROLL_HORIZONTAL) {
            this.content.getComponent(UITransform).width = contentSize;
        }
        else {
            this.content.getComponent(UITransform).height = contentSize;
        }

        this._itemIndex = this._dataIndex = this._itemArr.length - 1;
        log("初始化结束：", this._dataIndex, this._itemArr.length)
    }



    private scrollCheck() {
        let nowPos = this.getScrollOffset().y;
        let topPos = (this._dataIndex + 1 - this._numItem) * this._itemSize;//当前屏幕中靠近最开始的坐标

        //前面边框
        if (this._gapNum && this._gapNum[0]) {
            topPos += this._gapNum[0];
        }
        //间隙距离
        if (this._gapNum && this._gapNum[2]) {
            topPos += this._gapNum[2] * (this._dataIndex + 1 - this._numItem);
        }

        // let topPos = this.countPosByIndex(this._dataIndex + 1 - this._numItem);
        let size = this._itemSize;
        if (this._direction == SCROLL_HORIZONTAL) {
            nowPos = this.getScrollOffset().x;
            topPos = -topPos;
            size = -this._itemSize;
        }

        //判断向结束端滚动，滚动点和初始点对比
        if ((this._direction == SCROLL_VERTICAL && nowPos > size + topPos) ||
            (this._direction == SCROLL_HORIZONTAL && nowPos < size + topPos)) {
            let newIndex = this._dataIndex + 1;
            // Log.log(this._dataIndex, "-判断向结束端滚动 1 --将头部item转移到最后---", nowPos, topPos);
            if (newIndex >= this._dataArr.length) {
                return; //如果滚动到底部最后一条数据，不再进行写入
            }

            this._dataIndex = newIndex;

            let topItemIndex = this._itemIndex + 1;
            if (topItemIndex >= this._numItem) {
                topItemIndex = 0;
            }

            let item = this._itemArr[topItemIndex];
            if (item) {
                this.itemRender(item, newIndex);
                // Log.error(topItemIndex, "转移到最后", item.node.position);
            }

            this._itemIndex = topItemIndex;
        }

        //判断向开始端滚动
        else if ((this._direction == SCROLL_VERTICAL && nowPos < topPos) ||
            (this._direction == SCROLL_HORIZONTAL && nowPos > topPos)) {

            let newIndex = this._dataIndex + 1 - this._numItem - 1;
            // Log.log(this._dataIndex, "-判断向上滚动 2 -将最后item转移到头部----", newIndex);
            if (newIndex < 0) {
                // Log.warn("如果滚动到第一条数据，不再进行写入", newIndex)
                return; //如果滚动到第一条数据，不再进行写入
            }
            this._dataIndex--;
            // Log.error(this._itemIndex, "将最后item转移到头部", this._dataIndex, newIndex, newIndex * -this._itemSize);
            let item = this._itemArr[this._itemIndex];
            if (item) {
                this.itemRender(item, newIndex);
                // Log.error(this._itemIndex, "转移头部", item.node.position);
            }

            this._itemIndex--;
            if (this._itemIndex < 0) {
                this._itemIndex = this._numItem - 1;
            }
        }
    }


    /**刷新单项*/
    private itemRender(node: Node, newIndex: number) {
        //设置有全局得刷新事件
        if (this.onItemRender) {
            this.onItemRender(node, newIndex);
        }
        //没有全局，使用继承的item
        else {
            const item = node.getComponent(ScrollListItem)
            if (item) {
                item.onItemRender(this._dataArr[newIndex]);
            }
        }
        this.setPos(node, newIndex);

    }

    /**设置坐标*/
    private setPos(node: Node, index: number) {
        let pos = this.countPosByIndex(index);
        if (this._direction == SCROLL_HORIZONTAL) {
            node.setPosition(new Vec3(pos, 0));
        }
        else {
            node.setPosition(new Vec3(0, -pos));
        }
    }

    /**根据下标计算坐标。 0 ~ length-1*/
    private countPosByIndex(index: number): number {
        let pos = (1 / 2 + index) * this._itemSize;
        //前面距离边框
        if (this._gapNum && this._gapNum[0]) {
            pos += this._gapNum[0];
        }
        //间隙距离
        if (this._gapNum && this._gapNum[2]) {
            pos += this._gapNum[2] * index;
        }
        return pos;
    }







    /**滚动到指定下标*/
    public scroll2Index(index: number) {
        this.stopAutoScroll();
        //太靠近结束点，需要回退屏幕显示数量
        if (index > this._dataArr.length - this._numItem - 2) {
            index = this._dataArr.length - this._numItem - 2;
        }
        if (index < 0) {
            index = 0;
        }

        /**设置滚动坐标*/
        let pos = this.countPosByIndex(index) - 1 / 2 * this._itemSize;
        let ve = new Vec2(0, -pos);
        if (this._direction == SCROLL_HORIZONTAL) {
            ve = new Vec2(pos, 0);
        }
        this.scrollToOffset(ve);//滚动

        for (let x = 0; x < this._itemArr.length; x++) {
            this.itemRender(this._itemArr[x], index + x);
        }

        this._dataIndex = this._itemArr.length - 1 + index;//数据下标
        this._itemIndex = this._itemArr.length - 1;//重新赋值后节点下标为数组内当前最大

    }


}
