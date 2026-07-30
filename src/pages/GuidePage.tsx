import { PageCard } from "../components/common/PageCard";

export function GuidePage() {
  return (
    <div className="section-stack">
      <div className="page-intro">先看这一页，再去合成概率、规划路线、摆放推荐，会更顺。这里把当前网页版的真实规则、Excel 模板口径和推荐使用流程都整理好了。</div>

      <div className="page-grid two-column">
        <PageCard title="先知道的 4 件事" note="当前网页版总规则">
          <div className="kv-list">
            <div className="kv-item">
              <strong>1. 永久 O</strong>
              <span>棋盘默认带 1 个永久田字格 O，它不算在候选拼图里，但会参与摆放和合法配比判断。</span>
            </div>
            <div className="kv-item">
              <strong>2. 规划路线</strong>
              <span>规划路线页默认按 9 / 8 / 7 / 6 / 5 候选核心组合搜索，再补足目标拼图。</span>
            </div>
            <div className="kv-item">
              <strong>3. 候选等级</strong>
              <span>当前规划路线只接受蓝色 / 紫色候选；蓝色没有第二元素词条，紫色必须有第二元素词条。</span>
            </div>
            <div className="kv-item">
              <strong>4. 数据保存</strong>
              <span>网页数据默认保存在当前浏览器；也可以用 Excel 模板做导入、导出和批量维护。</span>
            </div>
          </div>
        </PageCard>

        <PageCard title="推荐使用流程" note="最省心的一套">
          <div className="kv-list">
            <div className="kv-item">
              <strong>第一步</strong>
              <span>先在“规划路线”里保存目标总体属性。</span>
            </div>
            <div className="kv-item">
              <strong>第二步</strong>
              <span>用单条添加、批量粘贴或 Excel 导入，把候选拼图录进去。</span>
            </div>
            <div className="kv-item">
              <strong>第三步</strong>
              <span>点“规划路线”，看候选够不够、缺什么形状、缺什么属性。</span>
            </div>
            <div className="kv-item">
              <strong>第四步</strong>
              <span>如果要做单个拼图合成概率，再去“合成概率”页单独算材料和命中率。</span>
            </div>
            <div className="kv-item">
              <strong>第五步</strong>
              <span>如果只关心站位怎么摆，再去“摆放推荐”页按形状搜索方案。</span>
            </div>
          </div>
        </PageCard>
      </div>

      <div className="page-grid two-column">
        <PageCard title="Excel 模板怎么填" note="Candidates 当前正式口径">
          <div className="kv-list">
            <div className="kv-item">
              <strong>字段顺序</strong>
              <span>个数、形状、等级、副属性、元素词条1、元素词条2、蓝色词条、备注。</span>
            </div>
            <div className="kv-item">
              <strong>个数</strong>
              <span>表示这种拼图有多少个；程序导入时会自动展开成多条候选。</span>
            </div>
            <div className="kv-item">
              <strong>蓝色拼图</strong>
              <span>元素词条2 要填“无”。</span>
            </div>
            <div className="kv-item">
              <strong>紫色拼图</strong>
              <span>元素词条2 必须填写具体词条。</span>
            </div>
            <div className="kv-item">
              <strong>元素判断</strong>
              <span>程序会根据元素词条1/2自动反推出元素，所以两个元素词条必须属于同一元素。</span>
            </div>
          </div>
        </PageCard>

        <PageCard title="批量添加候选怎么用" note="网页端直接粘贴">
          <div className="kv-list">
            <div className="kv-item">
              <strong>来源</strong>
              <span>可以直接从 Excel 的 Candidates 工作表复制多行内容。</span>
            </div>
            <div className="kv-item">
              <strong>推荐格式</strong>
              <span>按“个数、形状、等级、副属性、元素词条1、元素词条2、蓝色词条、备注”顺序粘贴。</span>
            </div>
            <div className="kv-item">
              <strong>示例</strong>
              <span>2 / O 田字格 / 蓝色 / 会心 / 天火陨星 / 无 / 同元素增强。</span>
            </div>
            <div className="kv-item">
              <strong>导入失败时</strong>
              <span>优先检查：等级是否填成蓝色/紫色、蓝色第二词条是否填无、两个元素词条是否同元素。</span>
            </div>
          </div>
        </PageCard>
      </div>

      <div className="page-grid two-column">
        <PageCard title="合成概率页说明" note="算单个目标拼图">
          <div className="kv-list">
            <div className="kv-item">
              <strong>用途</strong>
              <span>适合算某一个目标拼图的命中概率、单次材料和期望材料。</span>
            </div>
            <div className="kv-item">
              <strong>当前口径</strong>
              <span>紫色目标时，绿色词条和紫色词条对调也算命中。</span>
            </div>
            <div className="kv-item">
              <strong>结果理解</strong>
              <span>页面会同时给单次尝试材料和期望做成 1 个的材料，两种都可以看。</span>
            </div>
          </div>
        </PageCard>

        <PageCard title="摆放推荐页说明" note="只按形状看站位">
          <div className="kv-list">
            <div className="kv-item">
              <strong>用途</strong>
              <span>适合只关心形状怎么摆，不关心词条属性的时候用。</span>
            </div>
            <div className="kv-item">
              <strong>永久 O</strong>
              <span>摆放推荐页会自动带入 1 个永久 O，并尝试它的不同位置。</span>
            </div>
            <div className="kv-item">
              <strong>结果排序</strong>
              <span>优先返回摆得更多、剩余区域还能容纳更多、跳过更少的方案。</span>
            </div>
          </div>
        </PageCard>
      </div>
    </div>
  );
}
