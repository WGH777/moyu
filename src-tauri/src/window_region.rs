use serde::Deserialize;
use tauri::WebviewWindow;
use windows::Win32::{
    Foundation::{HWND, POINT, RECT},
    Graphics::Gdi::{ClientToScreen, CreateRectRgn, DeleteObject, SetWindowRgn},
    UI::WindowsAndMessaging::{GA_ROOT, GetAncestor, GetClientRect, GetWindowRect},
};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CssRegion {
    left: f64,
    top: f64,
    right: f64,
    bottom: f64,
    viewport_width: f64,
    viewport_height: f64,
    pixel_ratio: f64,
}

fn last_error(operation: &str) -> String {
    format!("{operation}: {}", windows::core::Error::from_thread())
}

fn restore(hwnd: HWND) -> Result<(), String> {
    if unsafe { SetWindowRgn(hwnd, None, true) } == 0 {
        return Err(last_error("恢复完整窗口区域失败"));
    }
    Ok(())
}

fn apply(hwnd: HWND, r: &CssRegion) -> Result<(), String> {
    let values = [
        r.left,
        r.top,
        r.right,
        r.bottom,
        r.viewport_width,
        r.viewport_height,
        r.pixel_ratio,
    ];
    if values.iter().any(|v| !v.is_finite())
        || r.pixel_ratio <= 0.0
        || r.viewport_width <= 0.0
        || r.viewport_height <= 0.0
        || r.left < 0.0
        || r.top < 0.0
        || r.right <= r.left
        || r.bottom <= r.top
        || r.right > r.viewport_width
        || r.bottom > r.viewport_height
    {
        return Err("无效或超出 viewport 的 CSS 区域".into());
    }
    let mut client = RECT::default();
    let mut outer = RECT::default();
    let mut origin = POINT::default();
    unsafe {
        GetClientRect(hwnd, &mut client).map_err(|e| format!("GetClientRect: {e}"))?;
        GetWindowRect(hwnd, &mut outer).map_err(|e| format!("GetWindowRect: {e}"))?;
        ClientToScreen(hwnd, &mut origin)
            .ok()
            .map_err(|e| format!("ClientToScreen: {e}"))?;
    }
    let scale = r.pixel_ratio;
    // Reject stale CSS/DPI samples instead of applying a misplaced region.
    if ((client.right - client.left) as f64 - r.viewport_width * scale).abs() > 2.0
        || ((client.bottom - client.top) as f64 - r.viewport_height * scale).abs() > 2.0
    {
        return Err("CSS 与客户区物理尺寸不一致，等待布局/DPI 更新".into());
    }
    let offset_x = (origin.x - outer.left) as f64;
    let offset_y = (origin.y - outer.top) as f64;
    let left = (offset_x + r.left * scale).floor();
    let top = (offset_y + r.top * scale).floor();
    let right = (offset_x + r.right * scale).ceil();
    let bottom = (offset_y + r.bottom * scale).ceil();
    if left < 0.0
        || top < 0.0
        || right > (outer.right - outer.left) as f64
        || bottom > (outer.bottom - outer.top) as f64
        || right > i32::MAX as f64
        || bottom > i32::MAX as f64
    {
        return Err("转换后的区域超出原生窗口".into());
    }
    let handle = unsafe { CreateRectRgn(left as i32, top as i32, right as i32, bottom as i32) };
    if handle.0.is_null() {
        return Err(last_error("CreateRectRgn 失败"));
    }
    if unsafe { SetWindowRgn(hwnd, Some(handle), true) } == 0 {
        let error = last_error("SetWindowRgn 失败");
        // Only a successful SetWindowRgn transfers ownership to Windows.
        if !unsafe { DeleteObject(handle.into()) }.as_bool() {
            eprintln!("{}", last_error("释放未转交的 HRGN 失败"));
        }
        return Err(error);
    }
    eprintln!(
        "窗口区域已应用: HWND={hwnd:?}, rect=({left},{top},{right},{bottom}), CSS scale={scale}"
    );
    Ok(())
}

fn update(window: &WebviewWindow, region: Option<CssRegion>) -> Result<(), String> {
    if window.label() != "main" {
        return Err("仅允许设置 main 窗口区域".into());
    }
    let hwnd = window
        .hwnd()
        .map_err(|e| format!("获取主窗口 HWND 失败: {e}"))?;
    if hwnd.0.is_null() || unsafe { GetAncestor(hwnd, GA_ROOT) } != hwnd {
        return Err("拒绝操作：句柄不是有效的顶层 HWND".into());
    }
    let result = match region {
        Some(r) => apply(hwnd, &r),
        None => restore(hwnd),
    };
    if let Err(error) = &result {
        eprintln!("窗口区域更新失败: {error}");
        if let Err(restore_error) = restore(hwnd) {
            eprintln!("{restore_error}");
            return Err(format!("{error}; {restore_error}"));
        }
    }
    result
}

#[tauri::command]
pub async fn set_test_window_region(
    window: WebviewWindow,
    region: Option<CssRegion>,
) -> Result<(), String> {
    let (sender, receiver) = std::sync::mpsc::channel();
    let target = window.clone();
    window
        .run_on_main_thread(move || {
            let _ = sender.send(update(&target, region));
        })
        .map_err(|e| format!("调度窗口区域操作失败: {e}"))?;
    tauri::async_runtime::spawn_blocking(move || {
        receiver
            .recv()
            .map_err(|e| format!("窗口已关闭或区域操作未完成: {e}"))?
    })
    .await
    .map_err(|e| format!("等待区域操作失败: {e}"))?
}
