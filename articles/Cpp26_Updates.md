# C++26 的更新

C++ 每三年发布一个新标准。C++26 作为 C++23 的继任者，延续了"实用优先"的路线：没有颠覆性的语法革命，却塞进了大量能立刻改善日常开发的新特性。这篇文章挑几个最有代表性的讲一讲。

## #embed：编译期嵌入二进制资源

以前要把图片、着色器等二进制文件塞进程序，要么用 xxd 转成数组，要么走构建脚本生成头文件。#embed 直接在源文件层面解决：

```cpp
#include <array>
#include <cstdint>

// 编译期把 icon.bin 的字节原样嵌入，零运行时开销
static constexpr std::array<std::uint8_t, 4096> icon = {
#embed "icon.bin"
};
```

编译器只会在预处理阶段读取文件内容，符号大小、格式都由编译器保证。资源被误改、缺文件时会在编译期直接报错，而不是运行时才炸。

## 契约（Contracts）：把前置条件写进签名

契约提供了 `[[pre:]]`、`[[post:]]`、`[[assert:]]` 三种注解，把"调用方必须满足的条件"从注释升级成语言级声明，可以在编译期或运行时检查：

```cpp
int divide(int a, int b)
    [[pre: b != 0]]
    [[post r: r * b == a]] {
    return a / b;
}
```

这比断言（assert）更进一步：契约属于函数签名的一部分，能被静态分析工具理解，也让阅读者一眼看到函数的使用约束。

## std::execution：统一的异步模型

C++26 引入了 `std::execution`，基于 sender/receiver 模型描述异步计算。它的核心思想是：把"做什么"（sender）和"谁来做"（执行上下文）解耦，从而在调度器、并发策略之间自由组合：

```cpp
namespace ex = std::execution;

auto task = ex::just(1, 2)
          | ex::then([](int a, int b) { return a + b; });

// 在不同的执行上下文（线程池、GPU、串行）上启动
std::this_thread::sync_wait(ex::schedule(pool) | task);
```

它的意义在于：过去割裂的 async、future、线程池、协程各搞一套，现在有了一个统一的组合语义。

## std::inplace_vector：固定容量、零堆分配的"动态数组"

`std::inplace_vector<T, N>` 拥有动态数组的接口（push_back、size 等），但存储完全内联在对象内部，不分配堆内存：

```cpp
#include <inplace_vector>

std::inplace_vector<int, 8> vec;   // 最多 8 个元素，全在栈上
vec.push_back(1);
vec.push_back(2);
```

对延迟敏感、禁止堆分配（如嵌入式、实时系统）的场景，它是 std::vector 的完美替代品。

## 其他值得关注的新特性

- **饱和运算**：`std::add_sat`、`std::sub_sat` 等让整数运算在溢出时"饱和"而非回绕，适合图像处理与传感器数据。
- **= delete 带原因**：`NoCopy(const NoCopy&) = delete("禁止拷贝");` 让编译错误信息直接说明原因。
- **std::is_within_lifetime**：安全地判断某个对象是否处于生命周期内，配合 union 与内存操作更安全。
- **std::text_encoding**：在运行时查询字符集编码信息，为国际化文本处理提供统一入口。

## 什么时候能用上

标准的落地永远晚于提案。目前 GCC、Clang 已开始提供实验性支持（例如 `-std=c++26` 配合对应的实验开关），#embed 等"零风险"特性普及最快。想要尝鲜，可以关注各家编译器的 `-std=c++2c`/`-std=c++26` 选项和 cppreference 的状态页。

## 结语

C++26 的更新没有惊世骇俗的新语法，却精准地补上了日常开发里最疼的几块：资源嵌入、契约检查、统一异步、零分配容器。对大多数项目而言，C++26 是那种"升级成本低、收益立竿见影"的标准版本。
