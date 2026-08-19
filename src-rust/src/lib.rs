use wasm_bindgen::prelude::*;
use image::codecs::jpeg::JpegEncoder;
use image::ImageEncoder;
use image::load_from_memory;
use std::io::Cursor;

#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

static mut RESULT_BUFFER: Vec<u8> = Vec::new();

#[wasm_bindgen]
pub fn compress_image(data: &[u8], quality: u32, max_width: u32) -> u32 {
    unsafe {
        RESULT_BUFFER.clear();
    }

    let img = match load_from_memory(data) {
        Ok(img) => img,
        Err(_) => return 0,
    };

    let mut img = img;

    if img.width() > max_width {
        let ratio = max_width as f32 / img.width() as f32;
        let new_height = (img.height() as f32 * ratio) as u32;
        img = img.resize(max_width, new_height, image::imageops::FilterType::Lanczos3);
    }

    let rgba = img.to_rgba8();
    let mut buffer = Cursor::new(Vec::new());
    let encoder = JpegEncoder::new_with_quality(&mut buffer, quality as u8);

    if encoder.write_image(
        &rgba,
        rgba.width(),
        rgba.height(),
        image::ColorType::Rgba8.into(),
    ).is_err() {
        return 0;
    }

    let compressed = buffer.into_inner();

    unsafe {
        RESULT_BUFFER = compressed;
        RESULT_BUFFER.len() as u32
    }
}

#[wasm_bindgen]
pub fn get_result_len(_ptr: u32) -> u32 {
    unsafe { RESULT_BUFFER.len() as u32 }
}

#[wasm_bindgen]
pub fn get_result_ptr() -> *const u8 {
    unsafe { RESULT_BUFFER.as_ptr() }
}

#[wasm_bindgen]
pub fn malloc(size: usize) -> *mut u8 {
    let mut buf = Vec::with_capacity(size);
    let ptr = buf.as_mut_ptr();
    std::mem::forget(buf);
    ptr
}

#[wasm_bindgen]
pub fn free(ptr: *mut u8) {
    unsafe {
        let _ = Vec::from_raw_parts(ptr, 0, 0);
    }
}
