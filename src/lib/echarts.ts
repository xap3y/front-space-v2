// Register only the chart types and features used by the dashboards.
import * as echarts from "echarts/core";
import {BarChart, LineChart, PieChart} from "echarts/charts";
import {
    AxisPointerComponent,
    DataZoomComponent,
    GraphicComponent,
    GridComponent,
    LegendComponent,
    ToolboxComponent,
    TooltipComponent,
} from "echarts/components";
import {CanvasRenderer} from "echarts/renderers";
import {LabelLayout, LegacyGridContainLabel, UniversalTransition} from "echarts/features";

echarts.use([
    BarChart,
    LineChart,
    PieChart,
    AxisPointerComponent,
    DataZoomComponent,
    GraphicComponent,
    GridComponent,
    LegendComponent,
    ToolboxComponent,
    TooltipComponent,
    CanvasRenderer,
    LabelLayout,
    LegacyGridContainLabel,
    UniversalTransition,
]);

export default echarts;
